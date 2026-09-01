import { v4 as uuidv4 } from 'uuid';

/**
 * Valid lifecycle stages matching the exact specification:
 * 1. File uploading
 * 2. File uploaded
 * 3. File added to queue
 * 4. Waiting for processing
 * 5. Processing…
 * 6. Completed
 * (Plus 'Failed' for unrecoverable errors/timeouts)
 */
export const TaskStatus = Object.freeze({
  UPLOADING: 'File uploading',
  UPLOADED: 'File uploaded',
  ADDED_TO_QUEUE: 'File added to queue',
  WAITING_FOR_PROCESSING: 'Waiting for processing',
  PROCESSING: 'Processing…',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
});

export const TaskPriority = Object.freeze({
  HIGH: 'high',
  LOW: 'low',
});

/**
 * Task domain model representing a CSV processing job.
 */
export class Task {
  /**
   * @param {Object} params
   * @param {string} params.clientId - Unique client identifier
   * @param {string} params.filename - On-disk filename
   * @param {string} params.originalName - Original uploaded filename
   * @param {string} params.filePath - Absolute path to file on disk
   * @param {number} params.fileSize - Size in bytes
   * @param {'high'|'low'} [params.priority='low'] - Job priority
   * @param {string} [params.id] - Optional predefined UUID
   */
  constructor({
    clientId,
    filename,
    originalName,
    filePath,
    fileSize = 0,
    priority = TaskPriority.LOW,
    id = uuidv4(),
  }) {
    this.id = id;
    this.clientId = clientId;
    this.filename = filename;
    this.originalName = originalName || filename;
    this.filePath = filePath;
    this.fileSize = fileSize;
    this.priority = priority.toLowerCase() === TaskPriority.HIGH ? TaskPriority.HIGH : TaskPriority.LOW;
    
    // Initial status
    this.status = TaskStatus.UPLOADED;
    this.progress = 0; // 0 to 100
    
    // Metadata discovered during processing
    this.rows = 0;
    this.columns = 0;
    this.numericCount = 0;
    this.result = null; // Final sum
    this.assignedWorkerId = null;
    this.error = null;
    
    // Timestamps
    this.createdAt = new Date().toISOString();
    this.enqueuedAt = null;
    this.startedAt = null;
    this.completedAt = null;
  }

  /**
   * Transition task status and update timestamps accordingly.
   * @param {string} newStatus
   * @param {Object} [metadata={}]
   */
  updateStatus(newStatus, metadata = {}) {
    this.status = newStatus;
    const now = new Date().toISOString();

    if (newStatus === TaskStatus.ADDED_TO_QUEUE && !this.enqueuedAt) {
      this.enqueuedAt = now;
    } else if (newStatus === TaskStatus.PROCESSING && !this.startedAt) {
      this.startedAt = now;
    } else if (newStatus === TaskStatus.COMPLETED) {
      this.completedAt = now;
      this.progress = 100;
    } else if (newStatus === TaskStatus.FAILED) {
      this.completedAt = now;
    }

    if (metadata.assignedWorkerId) {
      this.assignedWorkerId = metadata.assignedWorkerId;
    }
  }

  /**
   * Update progress percentage and intermediate statistics.
   * @param {number} progress - Progress integer (0-100)
   * @param {Object} [stats={}]
   */
  updateProgress(progress, stats = {}) {
    this.progress = Math.min(100, Math.max(0, Math.round(progress)));
    if (stats.rows !== undefined) this.rows = stats.rows;
    if (stats.columns !== undefined) this.columns = stats.columns;
    if (stats.numericCount !== undefined) this.numericCount = stats.numericCount;
    if (stats.runningSum !== undefined) this.result = stats.runningSum;
  }

  /**
   * Mark task as completed with final all-reduce sum and final statistics.
   * @param {number} finalSum
   * @param {Object} stats
   */
  complete(finalSum, stats = {}) {
    this.result = typeof finalSum === 'number' ? finalSum : parseFloat(finalSum) || 0;
    if (stats.rows !== undefined) this.rows = stats.rows;
    if (stats.columns !== undefined) this.columns = stats.columns;
    if (stats.numericCount !== undefined) this.numericCount = stats.numericCount;
    this.updateStatus(TaskStatus.COMPLETED);
  }

  /**
   * Mark task as failed with an error message.
   * @param {string|Error} error
   */
  fail(error) {
    this.error = error instanceof Error ? error.message : String(error);
    this.updateStatus(TaskStatus.FAILED);
  }

  /**
   * Return a serializable object representation safe for client communication.
   */
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
