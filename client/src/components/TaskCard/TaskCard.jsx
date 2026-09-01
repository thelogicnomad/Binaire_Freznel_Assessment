import React from 'react';
import './TaskCard.css';
import { FileText } from 'lucide-react';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { StageTimeline } from '../StageTimeline/StageTimeline';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { TaskResult } from '../TaskResult/TaskResult';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Editorial task visualization card with black border and divider line
 */
export function TaskCard({ task, currentClientId }) {
  const isOwner = task.clientId === currentClientId;
  const isHighPriority = task.priority === 'high';
  const isCompleted = task.status === 'Completed';
  const isProcessing = task.status === 'Processing…';

  return (
    <div className="TaskCard-container">
      {/* Header Section (Separated by 1px black divider) */}
      <div className="TaskCard-header-section">
        <div className="TaskCard-top-bar">
          <div className="TaskCard-badges-group">
            <StatusBadge
              type={isHighPriority ? 'priority-high' : 'priority-low'}
            />
            <StatusBadge
              type={isOwner ? 'owner-you' : 'owner-other'}
              clientId={task.clientId}
            />
          </div>

          <span className="TaskCard-timestamp">
            {new Date(task.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>

        <div className="TaskCard-file-header">
          <div className="TaskCard-file-info">
            <div className="TaskCard-file-icon-box">
              <FileText className="TaskCard-file-icon" />
            </div>
            <div className="TaskCard-file-details">
              <h3 className="TaskCard-file-name">{task.originalName}</h3>
              <span className="TaskCard-file-meta">
                {formatBytes(task.fileSize)} • ID: {task.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {task.assignedWorkerId && (
            <StatusBadge type="worker" workerId={task.assignedWorkerId} />
          )}
        </div>
      </div>

      {/* Body Section */}
      <div className="TaskCard-body-section">
        {/* 6-Stage Visual Timeline Stepper */}
        <div className="TaskCard-timeline-wrapper">
          <StageTimeline
            currentStatus={task.status}
            progress={task.progress}
            workerId={task.assignedWorkerId}
            error={task.error}
          />
        </div>

        {/* Active Processing Live Progress Bar */}
        {isProcessing && (
          <div className="TaskCard-progress-panel">
            <ProgressBar
              progress={task.progress}
              label="Summing numeric cells in dedicated worker thread..."
              sublabelLeft={`Rows parsed: ${task.rows.toLocaleString()}`}
              sublabelRight={`Numeric values: ${task.numericCount.toLocaleString()}`}
            />
          </div>
        )}

        {/* Completed All-Reduce Result Banner */}
        {isCompleted && (
          <TaskResult
            result={task.result}
            rows={task.rows}
            columns={task.columns}
            numericCount={task.numericCount}
          />
        )}
      </div>
    </div>
  );
}
