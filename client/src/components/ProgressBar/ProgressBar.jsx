import React from 'react';
import './ProgressBar.css';

/**
 * Reusable animated progress bar
 */
export function ProgressBar({
  progress = 0,
  label,
  showPercentage = true,
  variant = 'blue',
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
              <span className="ProgressBar-indicator-dot" />
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="ProgressBar-percentage">{safeProgress}%</span>
          )}
        </div>
      )}

      <div className="ProgressBar-track">
        <div
          className={`ProgressBar-fill ProgressBar-fill-${variant}`}
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
