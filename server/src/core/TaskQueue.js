import { TaskStatus, TaskPriority } from './Task.js';

export class TaskQueue {
  #high = [];
  #low = [];

  constructor() {
    this.#high = [];
    this.#low = [];
  }

  enqueue(task) {
    task.updateStatus(TaskStatus.ADDED_TO_QUEUE);

    if (task.priority === TaskPriority.HIGH) {
      this.#high.push(task);
      return {
        lane: TaskPriority.HIGH,
        position: this.#high.length,
        totalQueued: this.size(),
      };
    }

    this.#low.push(task);
    return {
      lane: TaskPriority.LOW,
      position: this.#low.length,
      totalQueued: this.size(),
    };
  }

  dequeue() {
    if (this.#high.length > 0) {
      return this.#high.shift();
    }
    if (this.#low.length > 0) {
      return this.#low.shift();
    }
    return null;
  }

  peek() {
    if (this.#high.length > 0) return this.#high[0];
    if (this.#low.length > 0) return this.#low[0];
    return null;
  }

  size() {
    return this.#high.length + this.#low.length;
  }

  isEmpty() {
    return this.size() === 0;
  }

  getLaneSizes() {
    return {
      high: this.#high.length,
      low: this.#low.length,
      total: this.size(),
    };
  }

  getAllQueuedTasks() {
    return [...this.#high, ...this.#low];
  }

  remove(taskId) {
    const hIdx = this.#high.findIndex(t => t.id === taskId);
    if (hIdx !== -1) {
      this.#high.splice(hIdx, 1);
      return true;
    }

    const lIdx = this.#low.findIndex(t => t.id === taskId);
    if (lIdx !== -1) {
      this.#low.splice(lIdx, 1);
      return true;
    }

    return false;
  }

  clear() {
    this.#high = [];
    this.#low = [];
  }
}
