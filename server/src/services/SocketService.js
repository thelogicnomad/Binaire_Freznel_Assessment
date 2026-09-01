/**
 * Connection & Broadcast layer wrapping Socket.io.
 * Handles client session registration, full queue broadcasts,
 * and targeted completion events to specific submitting clients.
 */
export class SocketService {
  /**
   * @param {import('socket.io').Server} io
   */
  constructor(io) {
    this.io = io;
    // Map: clientId -> Set<socketId>
    this.clientSockets = new Map();
    // Map: socketId -> clientId
    this.socketToClient = new Map();

    this.scheduler = null; // Injected later
    this._setupSocketListeners();
  }

  setScheduler(scheduler) {
    this.scheduler = scheduler;
  }

  _setupSocketListeners() {
    this.io.on('connection', (socket) => {
      // Handshake query can supply clientId
      const initialClientId = socket.handshake.query?.clientId;
      if (initialClientId) {
        this.registerClient(initialClientId, socket.id);
      }

      // Allow client to register or update its client ID
      socket.on('client:register', ({ clientId }) => {
        if (clientId) {
          this.registerClient(clientId, socket.id);
        }
      });

      // Send initial queue snapshot
      if (this.scheduler) {
        socket.emit('queue:snapshot', this.scheduler.getSnapshot());
      }

      socket.on('disconnect', () => {
        this.unregisterSocket(socket.id);
      });
    });
  }

  registerClient(clientId, socketId) {
    // Remove old association if socket had one
    const oldClientId = this.socketToClient.get(socketId);
    if (oldClientId && oldClientId !== clientId) {
      this.clientSockets.get(oldClientId)?.delete(socketId);
    }

    this.socketToClient.set(socketId, clientId);

    if (!this.clientSockets.has(clientId)) {
      this.clientSockets.set(clientId, new Set());
    }
    this.clientSockets.get(clientId).add(socketId);
  }

  unregisterSocket(socketId) {
    const clientId = this.socketToClient.get(socketId);
    if (clientId) {
      const set = this.clientSockets.get(clientId);
      if (set) {
        set.delete(socketId);
        if (set.size === 0) {
          this.clientSockets.delete(clientId);
        }
      }
      this.socketToClient.delete(socketId);
    }
  }

  /**
   * Broadcast task update or queue snapshot to all connected clients.
   * @param {Object} snapshot - Complete queue snapshot
   */
  broadcastQueue(snapshot) {
    this.io.emit('queue:update', snapshot);
  }

  /**
   * Broadcast lightweight progress update for a single task.
   * @param {Object} taskData - Serialized task with updated progress
   */
  broadcastTaskProgress(taskData) {
    this.io.emit('task:progress', taskData);
  }

  /**
   * Send the final summed result directly to the submitting client's open socket(s).
   * @param {string} clientId
   * @param {Object} taskResult
   */
  sendTaskCompleted(clientId, taskResult) {
    const socketIds = this.clientSockets.get(clientId);
    if (socketIds && socketIds.size > 0) {
      for (const socketId of socketIds) {
        this.io.to(socketId).emit('task:completed', taskResult);
      }
    }
  }

  /**
   * Broadcast worker pool and queue system metrics to all connected clients.
   * @param {Object} stats
   */
  broadcastStats(stats) {
    this.io.emit('stats:update', stats);
  }
}
