import { Worker } from 'worker_threads';
import EventEmitter from 'events';

/**
 * Encapsulated worker thread slot.
 */
class WorkerSlot {
  /**
   * @param {number} index - 1-based worker index
   * @param {string} scriptPath - Path to worker script
   * @param {number} timeoutMs - Task timeout limit
   * @param {Function} onMessage - Message relay callback
   * @param {Function} onError - Error callback
   */
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
      } catch (err) {
        // ignore cleanup error
      }
    }

    this.worker = new Worker(this.scriptPath);
    this.threadId = this.worker.threadId;
    this.isBusy = false;
    this.currentTaskId = null;

    this.worker.on('message', (message) => {
      this.onMessage(this, message);
    });

    this.worker.on('error', (err) => {
      this.onError(this, err);
    });

    this.worker.on('exit', (code) => {
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

    // Safety timeout: prevents hung workers from permanently locking pool slots
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

/**
 * Fixed-size WorkerPool managing worker_threads for parallel CSV processing.
 */
export class WorkerPool extends EventEmitter {
  /**
   * @param {Object} options
   * @param {number} options.size - Total worker threads
   * @param {string} options.scriptPath - Absolute path to csvWorker.js
   * @param {number} options.timeoutMs - Task timeout in ms
   */
  constructor({ size, scriptPath, timeoutMs = 30000 }) {
    super();
    this.size = Math.max(1, size);
    this.scriptPath = scriptPath;
    this.timeoutMs = timeoutMs;
    this.slots = [];

    this._initializePool();
  }

  _initializePool() {
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
    if (!message || !message.taskId) return;

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
      // Slot is now free for another task
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

    // Re-spawn worker to guarantee clean thread state after crash or timeout
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

    // Worker slot is reset and available
    this.emit('worker:free', slot);
  }

  /**
   * Check if any worker is currently idle.
   * @returns {boolean}
   */
  hasIdleWorker() {
    return this.slots.some((slot) => !slot.isBusy);
  }

  /**
   * Acquire an idle worker slot.
   * @returns {WorkerSlot|null}
   */
  acquireIdleWorker() {
    return this.slots.find((slot) => !slot.isBusy) || null;
  }

  /**
   * Assign a task to an idle worker and initiate execution.
   * @param {import('./Task.js').Task} task
   * @param {WorkerSlot} workerSlot
   */
  dispatchTask(task, workerSlot) {
    if (!workerSlot) {
      throw new Error('Cannot dispatch task: provided worker slot is invalid');
    }
    workerSlot.startTask(task);
  }

  /**
   * Get real-time status of all workers in the pool.
   * @returns {Array<Object>}
   */
  getStatus() {
    return this.slots.map((slot) => ({
      index: slot.index,
      displayId: slot.displayId,
      threadId: slot.threadId,
      isBusy: slot.isBusy,
      currentTaskId: slot.currentTaskId,
    }));
  }

  /**
   * Terminate all worker threads in the pool.
   */
  async terminateAll() {
    await Promise.all(this.slots.map((s) => s.terminate()));
  }
}
