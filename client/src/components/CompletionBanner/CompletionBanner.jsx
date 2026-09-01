import React from 'react';
import './CompletionBanner.css';
import { Sparkles, X } from 'lucide-react';

/**
 * Greentiq toast banner for completed all-reduce reductions
 */
export function CompletionBanner({ task, onDismiss }) {
  if (!task) return null;

  return (
    <aside aria-label="Task completion notification" className="CompletionBanner-wrapper">
      <div className="CompletionBanner-card">
        <div className="CompletionBanner-content">
          <div className="CompletionBanner-icon-box">
            <Sparkles className="CompletionBanner-icon" />
          </div>
          <div className="CompletionBanner-text">
            <div className="CompletionBanner-title-row">
              <h2 className="CompletionBanner-title">All-Reduce Reduction Complete</h2>
              <span className="CompletionBanner-filename">[ {task.filename} ]</span>
            </div>
            <p className="CompletionBanner-details">
              Total Sum:{' '}
              <strong className="CompletionBanner-sum-highlight">
                {Number(task.result).toLocaleString('en-US', {
                  maximumFractionDigits: 4,
                })}
              </strong>{' '}
              • {task.rows?.toLocaleString()} rows parsed in {task.durationMs}ms.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="CompletionBanner-dismiss-btn"
          title="Dismiss notification"
        >
          <X className="CompletionBanner-dismiss-icon" />
        </button>
      </div>
    </aside>
  );
}
