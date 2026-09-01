import { Worker } from 'worker_threads';
import EventEmitter from 'events';

class WorkerSlot {
  constructor(index, scriptPath, timeoutMs, onMessage, onError) {
    this.index = index;
    this.scriptPath = scriptPath;
    this.timeoutMs = timeoutMs;
    this.onMessage = onMessage;
    this.onError = onError;

    this.worker = null;
    this.threadId = null;
    this.isBusy = false;
    this.currentTaskId = null;
    this.timeoutTimer = null;

    this.spawnWorker();
  }

  get displayId() {
    return `Worker #${this.index} (TID ${this.threadId ?? 'init'})`;
  }

  spawnWorker() {
    if (this.worker) {
      try {
        this.worker.removeAllListeners();
        this.worker.terminate();
      } catch (e) {
        // ignore cleanup error on old worker
      }
    }

    this.worker = new Worker(this.scriptPath);
    this.threadId = this.worker.threadId;
    this.isBusy = false;
    this.currentTaskId = null;

    this.worker.on('message', (msg) => {
      this.onMessage(this, msg);
    });

    this.worker.on('error', (err) => {
      this.onError(this, err);
    });

    this.worker.on('exit', (code) => {
      // code !== 0 means worker crashed while working
      if (code !== 0 && this.isBusy) {
        this.onError(
          this,
          new Error(`Worker #${this.index} exited unexpectedly with code ${code}`)
        );
      }
    });
  }

  reserve(task) {
    this.isBusy = true;
    this.currentTaskId = task.id;
  }

  startTask(task) {
    this.isBusy = true;
    this.currentTaskId = task.id;

    // kill worker if it hangs longer than timeoutMs
    this.timeoutTimer = setTimeout(() => {
      const err = new Error(
        `Task timed out after ${this.timeoutMs}ms. Worker thread terminated.`
      );
      this.onError(this, err, true);
    }, this.timeoutMs);

    this.worker.postMessage({
      type: 'start',
      taskId: task.id,
      filePath: task.filePath,
      fileSize: task.fileSize,
    });
  }

  clearTask() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    this.isBusy = false;
    this.currentTaskId = null;
  }

  terminate() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.worker) {
      this.worker.removeAllListeners();
      return this.worker.terminate();
    }
    return Promise.resolve();
  }
}

// manages a fixed pool of worker threads
export class WorkerPool extends EventEmitter {
  constructor(opts = {}) {
    super();
    const { size = 4, scriptPath, timeoutMs = 30000 } = opts;
    this.size = Math.max(1, size);
    this.scriptPath = scriptPath;
    this.timeoutMs = timeoutMs;
    this.slots = [];

    this._initPool();
  }

  _initPool() {
    for (let i = 1; i <= this.size; i++) {
      const slot = new WorkerSlot(
        i,
        this.scriptPath,
        this.timeoutMs,
        (s, msg) => this._handleWorkerMessage(s, msg),
        (s, err, isTimeout) => this._handleWorkerError(s, err, isTimeout)
      );
      this.slots.push(slot);
    }
  }

  _handleWorkerMessage(slot, message) {
    if (!message?.taskId) return;

    if (message.type === 'progress') {
      this.emit('task:progress', {
        taskId: message.taskId,
        workerId: slot.displayId,
        progress: message.progress,
        rows: message.rows,
        columns: message.columns,
        numericCount: message.numericCount,
        runningSum: message.runningSum,
      });
    } else if (message.type === 'complete') {
      slot.clearTask();
      this.emit('task:complete', {
        taskId: message.taskId,
        workerId: slot.displayId,
        result: message.result,
        rows: message.rows,
        columns: message.columns,
        numericCount: message.numericCount,
        durationMs: message.durationMs,
      });
      this.emit('worker:free', slot);
    } else if (message.type === 'error') {
      slot.clearTask();
      this.emit('task:error', {
        taskId: message.taskId,
        workerId: slot.displayId,
        error: message.error || 'Worker execution failed',
      });
      this.emit('worker:free', slot);
    }
  }

  _handleWorkerError(slot, err, isTimeout = false) {
    const failedTaskId = slot.currentTaskId;
    slot.clearTask();

    // respawn so slot is clean for next job
    slot.spawnWorker();

    if (failedTaskId) {
      this.emit('task:error', {
        taskId: failedTaskId,
        workerId: slot.displayId,
        error: isTimeout
          ? `Timeout: Worker killed after exceeding ${this.timeoutMs}ms limit.`
          : `Worker thread error: ${err.message}`,
      });
    }

    this.emit('worker:free', slot);
  }

  hasIdleWorker() {
    return this.slots.some(s => !s.isBusy);
  }

  acquireIdleWorker() {
    return this.slots.find(s => !s.isBusy) || null;
  }

  dispatchTask(task, workerSlot) {
    if (!workerSlot) {
      throw new Error('Cannot dispatch task: provided worker slot is invalid');
    }
    workerSlot.startTask(task);
  }

  getStatus() {
    return this.slots.map(slot => ({
      index: slot.index,
      displayId: slot.displayId,
      threadId: slot.threadId,
      isBusy: slot.isBusy,
      currentTaskId: slot.currentTaskId,
    }));
  }

  async terminateAll() {
    const promises = this.slots.map(s => s.terminate());
    await Promise.all(promises);
  }
}
