import React from 'react';
import './TaskResult.css';
import { Calculator } from 'lucide-react';

function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-US', {
    maximumFractionDigits: 4,
  });
}

/**
 * Greentiq result display for all-reduce numeric sum
 */
export function TaskResult({ result, rows = 0, columns = 0, numericCount = 0 }) {
  return (
    <div className="TaskResult-card">
      <div className="TaskResult-main">
        <div className="TaskResult-icon-box">
          <Calculator className="TaskResult-calc-icon" />
        </div>
        <div className="TaskResult-text-group">
          <span className="TaskResult-heading">[ All-Reduce Final Sum ]</span>
          <div className="TaskResult-sum-value">{formatNumber(result)}</div>
        </div>
      </div>

      <div className="TaskResult-stats-grid">
        <div className="TaskResult-stat-item">
          <span className="TaskResult-stat-label">Rows</span>
          <span className="TaskResult-stat-value">{rows.toLocaleString()}</span>
        </div>
        <div className="TaskResult-stat-item">
          <span className="TaskResult-stat-label">Columns</span>
          <span className="TaskResult-stat-value">{columns || '-'}</span>
        </div>
        <div className="TaskResult-stat-item">
          <span className="TaskResult-stat-label">Numeric Values</span>
          <span className="TaskResult-stat-value">{numericCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
