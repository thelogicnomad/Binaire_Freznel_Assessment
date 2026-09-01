import React, { useEffect } from 'react';
import './CompletionBanner.css';
import { CheckCircle2, Trash2, X } from 'lucide-react';

export function CompletionBanner({ task, toast, onDismiss }) {
  const currentToast = toast || (task ? {
    type: 'completed',
    title: 'All-Reduce Completed',
    filename: task.filename,
    result: task.result,
    rows: task.rows,
    durationMs: task.durationMs,
  } : null);

  useEffect(() => {
    if (!currentToast) return;

    // auto-dismiss after 5s
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentToast, onDismiss]);

  if (!currentToast) return null;

  const isDelete = currentToast.type === 'deleted' || currentToast.type === 'cleared';

  return (
    <div
      aria-label="Toast notification"
      className="Toast-container"
      role="status"
    >
      <div className={`Toast-card ${isDelete ? 'Toast-card-delete' : 'Toast-card-success'}`}>
        <div className="Toast-body">
          <div className={`Toast-icon-box ${isDelete ? 'Toast-icon-box-delete' : 'Toast-icon-box-success'}`}>
            {isDelete ? (
              <Trash2 className="Toast-icon" />
            ) : (
              <CheckCircle2 className="Toast-icon" />
            )}
          </div>

          <div className="Toast-text">
            <div className="Toast-header-row">
              <span className="Toast-title">
                {currentToast.title || (isDelete ? 'Task Removed' : 'All-Reduce Completed')}
              </span>
              <button
                type="button"
                onClick={onDismiss}
                className="Toast-dismiss-btn"
                title="Dismiss notification"
                aria-label="Close notification"
              >
                <X className="Toast-dismiss-icon" />
              </button>
            </div>

            {currentToast.filename && (
              <span className="Toast-filename">
                [ {currentToast.filename} ]
              </span>
            )}

            {currentToast.message && (
              <span className="Toast-message">
                {currentToast.message}
              </span>
            )}

            {currentToast.result !== undefined && (
              <div className="Toast-sum-row">
                <span className="Toast-sum-label">Reduction Sum</span>
                <span className="Toast-sum-value">
                  {Number(currentToast.result).toLocaleString('en-US', {
                    maximumFractionDigits: 4,
                  })}
                </span>
              </div>
            )}

            {currentToast.rows !== undefined && (
              <span className="Toast-meta-sub">
                {currentToast.rows.toLocaleString()} rows parsed {currentToast.durationMs !== undefined ? `in ${currentToast.durationMs}ms` : ''}
              </span>
            )}
          </div>
        </div>

        {/* 5s Countdown Bar */}
        <div className="Toast-countdown-track">
          <div className={`Toast-countdown-bar ${isDelete ? 'Toast-countdown-bar-delete' : 'Toast-countdown-bar-success'}`} />
        </div>
      </div>
    </div>
  );
}

export const ToastNotification = CompletionBanner;
