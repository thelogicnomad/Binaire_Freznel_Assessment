import React, { useEffect } from 'react';
import './CompletionBanner.css';
import { CheckCircle2, X } from 'lucide-react';

/**
 * Greentiq floating toast notification for completed all-reduce reductions.
 * Features 5-second auto-dismiss countdown with manual close option.
 */
export function CompletionBanner({ task, onDismiss }) {
  useEffect(() => {
    if (!task) return;

    // Automatically dismiss toast after 5 seconds
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [task, onDismiss]);

  if (!task) return null;

  return (
    <div
      aria-label="Task completion toast notification"
      className="CompletionBanner-toast-container"
      role="status"
    >
      <div className="CompletionBanner-card">
        <div className="CompletionBanner-body">
          <div className="CompletionBanner-icon-box">
            <CheckCircle2 className="CompletionBanner-icon" />
          </div>

          <div className="CompletionBanner-text">
            <div className="CompletionBanner-header-row">
              <span className="CompletionBanner-title">All-Reduce Completed</span>
              <button
                type="button"
                onClick={onDismiss}
                className="CompletionBanner-dismiss-btn"
                title="Dismiss notification"
                aria-label="Close notification"
              >
                <X className="CompletionBanner-dismiss-icon" />
              </button>
            </div>

            <span className="CompletionBanner-filename">
              [ {task.filename} ]
            </span>

            <div className="CompletionBanner-sum-row">
              <span className="CompletionBanner-sum-label">Reduction Sum</span>
              <span className="CompletionBanner-sum-value">
                {Number(task.result).toLocaleString('en-US', {
                  maximumFractionDigits: 4,
                })}
              </span>
            </div>

            <span className="CompletionBanner-meta-sub">
              {task.rows?.toLocaleString()} rows parsed in {task.durationMs}ms
            </span>
          </div>
        </div>

        {/* Animated 5s Countdown Bar */}
        <div className="CompletionBanner-countdown-track">
          <div className="CompletionBanner-countdown-bar" />
        </div>
      </div>
    </div>
  );
}
