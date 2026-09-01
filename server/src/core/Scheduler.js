import EventEmitter from 'events';
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
      // Using a micro-delay (100ms) ensures the 'Waiting for processing' state
      // with assigned worker ID is distinctly observable before live streaming starts
      setTimeout(() => {
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
