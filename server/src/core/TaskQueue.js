import { TaskStatus, TaskPriority } from './Task.js';

/**
 * Priority queue encapsulating high and low priority lanes.
 * Implements strict FIFO within lanes and prioritizes high over low.
 */
export class TaskQueue {
  // Private lane arrays to prevent external mutation
  #highQueue = [];
  #lowQueue = [];

  constructor() {
    this.#highQueue = [];
    this.#lowQueue = [];
  }

  /**
   * Enqueue a task into its appropriate priority lane.
   * Updates task status to 'File added to queue'.
   * @param {import('./Task.js').Task} task
   * @returns {{ lane: string, position: number, totalQueued: number }}
   */
  enqueue(task) {
    task.updateStatus(TaskStatus.ADDED_TO_QUEUE);

    if (task.priority === TaskPriority.HIGH) {
      this.#highQueue.push(task);
      return {
        lane: TaskPriority.HIGH,
        position: this.#highQueue.length,
        totalQueued: this.size(),
      };
    } else {
      this.#lowQueue.push(task);
      return {
        lane: TaskPriority.LOW,
        position: this.#lowQueue.length,
        totalQueued: this.size(),
      };
    }
  }

  /**
   * Dequeue the next task to process.
   * Priority rule: All high-priority tasks are served before low-priority tasks.
   * Tie-breaker: Strict FIFO order of arrival within the same priority lane.
   * @returns {import('./Task.js').Task|null}
   */
  dequeue() {
    if (this.#highQueue.length > 0) {
      return this.#highQueue.shift();
    }
    if (this.#lowQueue.length > 0) {
      return this.#lowQueue.shift();
    }
    return null;
  }

  /**
   * Look at the next task without removing it.
   * @returns {import('./Task.js').Task|null}
   */
  peek() {
    if (this.#highQueue.length > 0) {
      return this.#highQueue[0];
    }
    if (this.#lowQueue.length > 0) {
      return this.#lowQueue[0];
    }
    return null;
  }

  /**
   * Total number of waiting tasks across all lanes.
   * @returns {number}
   */
  size() {
    return this.#highQueue.length + this.#lowQueue.length;
  }

  /**
   * Check if the queue has any waiting tasks.
   * @returns {boolean}
   */
  isEmpty() {
    return this.size() === 0;
  }

  /**
   * Get size breakdown by lane.
   * @returns {{ high: number, low: number, total: number }}
   */
  getLaneSizes() {
    return {
      high: this.#highQueue.length,
      low: this.#lowQueue.length,
      total: this.size(),
    };
  }

  /**
   * Return a snapshot of all queued tasks in scheduled order (high priority first, then low).
   * Returns a cloned list so callers cannot mutate internal arrays.
   * @returns {Array<import('./Task.js').Task>}
   */
  getAllQueuedTasks() {
    return [...this.#highQueue, ...this.#lowQueue];
  }

  /**
   * Remove a task from the queue by ID (e.g. if cancelled).
   * @param {string} taskId
   * @returns {boolean} true if task was found and removed
   */
  remove(taskId) {
    const highIdx = this.#highQueue.findIndex((t) => t.id === taskId);
    if (highIdx !== -1) {
      this.#highQueue.splice(highIdx, 1);
      return true;
    }

    const lowIdx = this.#lowQueue.findIndex((t) => t.id === taskId);
    if (lowIdx !== -1) {
      this.#lowQueue.splice(lowIdx, 1);
      return true;
    }

    return false;
  }

  /**
   * Clear all queued tasks.
   */
  clear() {
    this.#highQueue = [];
    this.#lowQueue = [];
  }
}
