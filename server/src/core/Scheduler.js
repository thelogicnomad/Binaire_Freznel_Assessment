import EventEmitter from 'events';
import fs from 'fs';
import { TaskStatus } from './Task.js';

export class Scheduler extends EventEmitter {
  constructor({ taskQueue, workerPool, socketService = null }) {
    super();
    this.taskQueue = taskQueue;
    this.workerPool = workerPool;
    this.socketService = socketService;

    this.tasks = new Map();
    this.taskOrder = [];

    this._bindWorkerEvents();
  }

  setSocketService(svc) {
    this.socketService = svc;
  }

  _bindWorkerEvents() {
    this.workerPool.on('worker:free', () => {
      this.schedule();
    });

    this.workerPool.on('task:progress', (info) => {
      const { taskId, workerId, progress, rows, columns, numericCount, runningSum } = info;
      const task = this.tasks.get(taskId);
      if (!task) return;

      if (task.status === TaskStatus.WAITING_FOR_PROCESSING) {
        task.updateStatus(TaskStatus.PROCESSING, { assignedWorkerId: workerId });
      }

      task.updateProgress(progress, {
        rows,
        columns,
        numericCount,
        runningSum,
      });

      this._notifyTaskProgress(task);
    });

    this.workerPool.on('task:complete', (data) => {
      const { taskId, result, rows, columns, numericCount, durationMs } = data;
      const task = this.tasks.get(taskId);
      if (!task) return;

      task.complete(result, { rows, columns, numericCount });

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
    });

    this.workerPool.on('task:error', ({ taskId, error }) => {
      const task = this.tasks.get(taskId);
      if (!task) return;

      task.fail(error);
      this._notifyQueueChanged();
    });
  }

  addTask(task) {
    this.tasks.set(task.id, task);
    this.taskOrder.unshift(task.id);

    this.taskQueue.enqueue(task);
    this._notifyQueueChanged();

    setImmediate(() => this.schedule());
  }

  removeTask(taskId, clientId = null) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (clientId && task.clientId !== clientId) {
      throw new Error('Unauthorized: You can only remove your own tasks.');
    }

    this.taskQueue.remove(taskId);
    this.tasks.delete(taskId);
    this.taskOrder = this.taskOrder.filter(id => id !== taskId);

    if (task.filePath && fs.existsSync(task.filePath)) {
      try {
        fs.unlinkSync(task.filePath);
      } catch (err) {
        console.warn(`[scheduler] failed to remove file ${task.filePath}:`, err.message);
      }
    }

    this._notifyQueueChanged();
    return true;
  }

  clearClientTasks(clientId, onlyCompleted = true) {
    let count = 0;
    const allIds = [...this.tasks.keys()];

    for (let i = 0; i < allIds.length; i++) {
      const id = allIds[i];
      const task = this.tasks.get(id);
      if (!task || task.clientId !== clientId) continue;

      if (onlyCompleted && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.FAILED) {
        continue;
      }

      this.removeTask(id, clientId);
      count++;
    }

    return count;
  }

  schedule() {
    while (this.workerPool.hasIdleWorker() && !this.taskQueue.isEmpty()) {
      const idleWorker = this.workerPool.acquireIdleWorker();
      if (!idleWorker) break;

      const nextTask = this.taskQueue.dequeue();
      if (!nextTask) break;

      idleWorker.reserve(nextTask);

      nextTask.updateStatus(TaskStatus.WAITING_FOR_PROCESSING, {
        assignedWorkerId: idleWorker.displayId,
      });

      this._notifyQueueChanged();

      setTimeout(() => {
        if (!this.tasks.has(nextTask.id)) {
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
    const snap = this.getSnapshot();
    if (this.socketService) {
      this.socketService.broadcastQueue(snap);
    }
    this.emit('change', snap);
  }

  _notifyTaskProgress(task) {
    if (this.socketService) {
      this.socketService.broadcastTaskProgress(task.toJSON());
    }
  }

  getSnapshot() {
    const laneSizes = this.taskQueue.getLaneSizes();
    const workerStatus = this.workerPool.getStatus();

    const tasksList = this.taskOrder
      .map(id => this.tasks.get(id))
      .filter(Boolean)
      .map(t => t.toJSON());

    return {
      tasks: tasksList,
      stats: {
        totalTasks: this.tasks.size,
        queuedHigh: laneSizes.high,
        queuedLow: laneSizes.low,
        totalQueued: laneSizes.total,
        activeWorkers: workerStatus.filter(w => w.isBusy).length,
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
