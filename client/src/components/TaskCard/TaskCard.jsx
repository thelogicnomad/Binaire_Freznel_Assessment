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
 * Single task visualization card
 */
export function TaskCard({ task, currentClientId }) {
  const isOwner = task.clientId === currentClientId;
  const isHighPriority = task.priority === 'high';
  const isCompleted = task.status === 'Completed';
  const isProcessing = task.status === 'Processing…';
  const isFailed = task.status === 'Failed';

  let containerClass = 'TaskCard-container';
  if (isCompleted) containerClass += ' TaskCard-completed';
  else if (isProcessing) containerClass += ' TaskCard-processing';
  else if (isFailed) containerClass += ' TaskCard-failed';
  else if (isHighPriority) containerClass += ' TaskCard-high-priority';

  let iconBoxClass = 'TaskCard-file-icon-box';
  if (isCompleted) iconBoxClass += ' TaskCard-file-icon-completed';
  else if (isProcessing) iconBoxClass += ' TaskCard-file-icon-processing';

  return (
    <div className={containerClass}>
      {isHighPriority && <div className="TaskCard-glow-accent" />}

      {/* Top Bar: Badges & Timestamp */}
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

      {/* Main File Title & Worker ID */}
      <div className="TaskCard-file-header">
        <div className="TaskCard-file-info">
          <div className={iconBoxClass}>
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
            label="Summing numeric values in worker thread..."
            variant="blue"
            sublabelLeft={`Rows parsed: ${task.rows.toLocaleString()}`}
            sublabelRight={`Numbers summed: ${task.numericCount.toLocaleString()}`}
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
  );
}
