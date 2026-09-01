import EventEmitter from 'events';
import fs from 'fs';
import { TaskStatus } from './Task.js';

/**
 * Event-driven Scheduler that orchestrates task queueing and worker execution.
 * Manages task lifecycles, assigns tasks to available workers, and relays updates.
 */
export class Scheduler extends EventEmitter {
  /**
   * @param {Object} dependencies
   * @param {import('./TaskQueue.js').TaskQueue} dependencies.taskQueue
   * @param {import('./WorkerPool.js').WorkerPool} dependencies.workerPool
   * @param {import('../services/SocketService.js').SocketService} [dependencies.socketService]
   */
  constructor({ taskQueue, workerPool, socketService = null }) {
    super();
    this.taskQueue = taskQueue;
    this.workerPool = workerPool;
    this.socketService = socketService;

    // Fast-lookup map of all active/recent tasks: taskId -> Task
    this.tasks = new Map();
    // Ordered list of task IDs for snapshot consistency
    this.taskOrder = [];

    this._setupWorkerEvents();
  }

  setSocketService(socketService) {
    this.socketService = socketService;
  }

  _setupWorkerEvents() {
    // When a worker becomes free, run the scheduler loop
    this.workerPool.on('worker:free', () => {
      this.schedule();
    });

    // When worker thread reports streaming progress
    this.workerPool.on(
      'task:progress',
      ({ taskId, workerId, progress, rows, columns, numericCount, runningSum }) => {
        const task = this.tasks.get(taskId);
        if (!task) return;

        // If it was waiting, move to processing now
        if (task.status === TaskStatus.WAITING_FOR_PROCESSING) {
          task.updateStatus(TaskStatus.PROCESSING, { assignedWorkerId: workerId });
        }

        task.updateProgress(progress, {
          rows,
          columns,
          numericCount,
          runningSum,
        });

        // Broadcast progress update
        this._notifyTaskProgress(task);
      }
    );

    // When worker thread successfully finishes all-reduce sum
    this.workerPool.on(
      'task:complete',
      ({ taskId, workerId, result, rows, columns, numericCount, durationMs }) => {
        const task = this.tasks.get(taskId);
        if (!task) return;

        task.complete(result, { rows, columns, numericCount });

        // Targeted event to submitting client
        if (this.socketService) {
          this.socketService.sendTaskCompleted(task.clientId, {
            taskId: task.id,
            filename: task.originalName,
            result: task.result,
            rows: task.rows,
            columns: task.columns,
            numericCount: task.numericCount,
            durationMs,
          });
        }

        this._notifyQueueChanged();
      }
    );

    // When worker thread errors or times out
    this.workerPool.on('task:error', ({ taskId, error }) => {
      const task = this.tasks.get(taskId);
      if (!task) return;

      task.fail(error);
      this._notifyQueueChanged();
    });
  }

  /**
   * Add a new task to the queue and trigger scheduling.
   * @param {import('./Task.js').Task} task
   */
  addTask(task) {
    this.tasks.set(task.id, task);
    this.taskOrder.unshift(task.id); // Newest on top

    // Enqueue task (sets status to 'File added to queue')
    this.taskQueue.enqueue(task);

    this._notifyQueueChanged();

    // Trigger non-blocking assignment
    setImmediate(() => this.schedule());
  }

  /**
   * Remove/cancel a task by taskId and optional clientId.
   * @param {string} taskId
   * @param {string} [clientId]
   * @returns {boolean}
   */
  removeTask(taskId, clientId = null) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // If clientId specified, ensure only owner can remove
    if (clientId && task.clientId !== clientId) {
      throw new Error('Unauthorized: You can only remove your own tasks.');
    }

    // 1. Remove from waiting queue if in queue
    this.taskQueue.remove(taskId);

    // 2. Remove from tasks map and order list
    this.tasks.delete(taskId);
    this.taskOrder = this.taskOrder.filter((id) => id !== taskId);

    // 3. Clean up file on disk if exists
    if (task.filePath && fs.existsSync(task.filePath)) {
      try {
        fs.unlinkSync(task.filePath);
      } catch (err) {
        console.warn(`Could not delete file ${task.filePath}:`, err.message);
      }
    }

    this._notifyQueueChanged();
    return true;
  }

  /**
   * Clear all completed or all tasks for a given clientId.
   * @param {string} clientId
   * @param {boolean} [onlyCompleted=true]
   * @returns {number} count of removed tasks
   */
  clearClientTasks(clientId, onlyCompleted = true) {
    let count = 0;
    const taskIds = [...this.tasks.keys()];

    for (const taskId of taskIds) {
      const task = this.tasks.get(taskId);
      if (!task || task.clientId !== clientId) continue;

      if (onlyCompleted && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.FAILED) {
        continue;
      }

      this.removeTask(taskId, clientId);
      count++;
    }

    return count;
  }

  /**
   * Core assignment loop: matches idle workers with highest-priority tasks.
   * Guaranteed never to block the event loop.
   */
  schedule() {
    while (this.workerPool.hasIdleWorker() && !this.taskQueue.isEmpty()) {
      const idleWorker = this.workerPool.acquireIdleWorker();
      if (!idleWorker) break;

      const nextTask = this.taskQueue.dequeue();
      if (!nextTask) break;

      // Immediately reserve the worker slot to prevent duplicate assignments in concurrent loop passes
      idleWorker.reserve(nextTask);

      // Transition to 'Waiting for processing' with assigned worker ID displayed
      nextTask.updateStatus(TaskStatus.WAITING_FOR_PROCESSING, {
        assignedWorkerId: idleWorker.displayId,
      });

      this._notifyQueueChanged();

      // Dispatch to worker pool
      setTimeout(() => {
        // Double check task hasn't been deleted or cancelled in the interim
        if (!this.tasks.has(nextTask.id)) {
          idleWorker.release();
          return;
        }

        if (nextTask.status === TaskStatus.WAITING_FOR_PROCESSING) {
          nextTask.updateStatus(TaskStatus.PROCESSING, {
            assignedWorkerId: idleWorker.displayId,
          });
          this._notifyQueueChanged();
        }
        this.workerPool.dispatchTask(nextTask, idleWorker);
      }, 100);
    }
  }

  _notifyQueueChanged() {
    if (this.socketService) {
      this.socketService.broadcastQueue(this.getSnapshot());
    }
    this.emit('change', this.getSnapshot());
  }

  _notifyTaskProgress(task) {
    if (this.socketService) {
      this.socketService.broadcastTaskProgress(task.toJSON());
    }
  }

  /**
   * Produce comprehensive queue snapshot for all connected clients.
   */
  getSnapshot() {
    const laneSizes = this.taskQueue.getLaneSizes();
    const workerStatus = this.workerPool.getStatus();

    const tasksList = this.taskOrder
      .map((id) => this.tasks.get(id))
      .filter(Boolean)
      .map((task) => task.toJSON());

    return {
      tasks: tasksList,
      stats: {
        totalTasks: this.tasks.size,
        queuedHigh: laneSizes.high,
        queuedLow: laneSizes.low,
        totalQueued: laneSizes.total,
        activeWorkers: workerStatus.filter((w) => w.isBusy).length,
        totalWorkers: workerStatus.length,
        workers: workerStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }

  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }
}
