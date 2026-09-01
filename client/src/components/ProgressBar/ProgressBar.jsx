import React from 'react';
import './ProgressBar.css';

/**
 * Greentiq progress bar with var(--primary) fill on var(--muted) track
 */
export function ProgressBar({
  progress = 0,
  label,
  showPercentage = true,
  sublabelLeft,
  sublabelRight,
}) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="ProgressBar-container">
      {(label || showPercentage) && (
        <div className="ProgressBar-header">
          {label && (
            <span className="ProgressBar-label">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="ProgressBar-percentage">[ {safeProgress}% ]</span>
          )}
        </div>
      )}

      <div className="ProgressBar-track">
        <div
          className="ProgressBar-fill"
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      {(sublabelLeft || sublabelRight) && (
        <div className="ProgressBar-sublabels">
          <span>{sublabelLeft}</span>
          <span>{sublabelRight}</span>
        </div>
      )}
    </div>
  );
}
