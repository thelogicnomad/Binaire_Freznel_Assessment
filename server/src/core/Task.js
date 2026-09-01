import { v4 as uuidv4 } from 'uuid';

export const TaskStatus = Object.freeze({
  UPLOADING: 'File uploading',
  UPLOADED: 'File uploaded',
  ADDED_TO_QUEUE: 'File added to queue',
  WAITING_FOR_PROCESSING: 'Waiting for processing',
  PROCESSING: 'Processing…',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
});

export const TaskPriority = {
  HIGH: 'high',
  LOW: 'low',
};

export class Task {
  constructor(opts = {}) {
    const {
      clientId,
      filename,
      originalName,
      filePath,
      fileSize = 0,
      priority = 'low',
      id = uuidv4(),
    } = opts;

    this.id = id;
    this.clientId = clientId;
    this.filename = filename;
    this.originalName = originalName || filename;
    this.filePath = filePath;
    this.fileSize = fileSize;
    
    // priority lane flag
    const p = String(priority).toLowerCase();
    this.priority = (p === 'high') ? TaskPriority.HIGH : TaskPriority.LOW;
    
    this.status = TaskStatus.UPLOADED;
    this.progress = 0;
    
    // stats parsed by worker
    this.rows = 0;
    this.columns = 0;
    this.numericCount = 0;
    this.result = null; // total sum
    this.assignedWorkerId = null;
    this.error = null;
    
    // lifecycle dates
    this.createdAt = new Date().toISOString();
    this.enqueuedAt = null;
    this.startedAt = null;
    this.completedAt = null;
  }

  updateStatus(newStatus, meta = {}) {
    this.status = newStatus;
    const now = new Date().toISOString();

    if (newStatus === TaskStatus.ADDED_TO_QUEUE && !this.enqueuedAt) {
      this.enqueuedAt = now;
    } else if (newStatus === TaskStatus.PROCESSING && !this.startedAt) {
      this.startedAt = now;
    } else if (newStatus === TaskStatus.COMPLETED || newStatus === TaskStatus.FAILED) {
      this.completedAt = now;
      if (newStatus === TaskStatus.COMPLETED) {
        this.progress = 100;
      }
    }

    if (meta.assignedWorkerId) {
      this.assignedWorkerId = meta.assignedWorkerId;
    }
  }

  updateProgress(pct, stats = {}) {
    this.progress = Math.min(100, Math.max(0, Math.round(pct)));
    if (stats.rows !== undefined) this.rows = stats.rows;
    if (stats.columns !== undefined) this.columns = stats.columns;
    if (stats.numericCount !== undefined) this.numericCount = stats.numericCount;
    if (stats.runningSum !== undefined) this.result = stats.runningSum;
  }

  complete(finalSum, stats = {}) {
    const val = typeof finalSum === 'number' ? finalSum : parseFloat(finalSum);
    this.result = isNaN(val) ? 0 : val;
    if (stats.rows !== undefined) this.rows = stats.rows;
    if (stats.columns !== undefined) this.columns = stats.columns;
    if (stats.numericCount !== undefined) this.numericCount = stats.numericCount;
    this.updateStatus(TaskStatus.COMPLETED);
  }

  fail(err) {
    this.error = err?.message ? err.message : String(err);
    this.updateStatus(TaskStatus.FAILED);
  }

  toJSON() {
    return {
      id: this.id,
      clientId: this.clientId,
      filename: this.filename,
      originalName: this.originalName,
      fileSize: this.fileSize,
      priority: this.priority,
      status: this.status,
      progress: this.progress,
      rows: this.rows,
      columns: this.columns,
      numericCount: this.numericCount,
      result: this.result,
      assignedWorkerId: this.assignedWorkerId,
      error: this.error,
      createdAt: this.createdAt,
      enqueuedAt: this.enqueuedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }
}
