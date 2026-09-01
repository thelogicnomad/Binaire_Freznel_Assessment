export class SocketService {
  constructor(io) {
    this.io = io;
    this.clientSockets = new Map();
    this.socketToClient = new Map();
    this.scheduler = null;

    this._bindEvents();
  }

  setScheduler(scheduler) {
    this.scheduler = scheduler;
  }

  _bindEvents() {
    this.io.on('connection', (socket) => {
      const qClientId = socket.handshake.query?.clientId;
      if (qClientId) {
        this.registerClient(qClientId, socket.id);
      }

      socket.on('client:register', (payload) => {
        if (payload?.clientId) {
          this.registerClient(payload.clientId, socket.id);
        }
      });

      if (this.scheduler) {
        socket.emit('queue:snapshot', this.scheduler.getSnapshot());
      }

      socket.on('disconnect', () => {
        this.unregisterSocket(socket.id);
      });
    });
  }

  registerClient(clientId, socketId) {
    const prevClient = this.socketToClient.get(socketId);
    if (prevClient && prevClient !== clientId) {
      this.clientSockets.get(prevClient)?.delete(socketId);
    }

    this.socketToClient.set(socketId, clientId);

    if (!this.clientSockets.has(clientId)) {
      this.clientSockets.set(clientId, new Set());
    }
    this.clientSockets.get(clientId).add(socketId);
  }

  unregisterSocket(socketId) {
    const cId = this.socketToClient.get(socketId);
    if (!cId) return;

    const set = this.clientSockets.get(cId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) {
        this.clientSockets.delete(cId);
      }
    }
    this.socketToClient.delete(socketId);
  }

  broadcastQueue(snapshot) {
    this.io.emit('queue:update', snapshot);
  }

  broadcastTaskProgress(taskData) {
    this.io.emit('task:progress', taskData);
  }

  sendTaskCompleted(clientId, taskResult) {
    const sockets = this.clientSockets.get(clientId);
    if (!sockets || sockets.size === 0) return;

    for (const sid of sockets) {
      this.io.to(sid).emit('task:completed', taskResult);
    }
  }

  broadcastStats(stats) {
    this.io.emit('stats:update', stats);
  }
}
