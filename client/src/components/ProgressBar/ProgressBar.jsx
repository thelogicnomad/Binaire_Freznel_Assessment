import React from 'react';
import './ProgressBar.css';

export function ProgressBar({
  progress = 0,
  label,
  showPercentage = true,
  sublabelLeft,
  sublabelRight,
}) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="ProgressBar-container">
      {(label || showPercentage) && (
        <div className="ProgressBar-header">
          {label && <span className="ProgressBar-label">{label}</span>}
          {showPercentage && (
            <span className="ProgressBar-percentage">[ {pct}% ]</span>
          )}
        </div>
      )}

      <div className="ProgressBar-track">
        <div
          className="ProgressBar-fill"
          style={{ width: `${pct}%` }}
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
