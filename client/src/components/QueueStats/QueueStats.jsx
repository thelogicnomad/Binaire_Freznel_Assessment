import React from 'react';
import './QueueStats.css';
import { Flame, Clock, Cpu, CheckCircle2 } from 'lucide-react';

export function QueueStats({ stats, tasks }) {
  const completed = tasks.filter(t => t.status === 'Completed');
  const totalSum = completed.reduce((acc, t) => acc + (t.result || 0), 0);

  return (
    <div className="QueueStats-grid">
      {/* High Priority Lane Card */}
      <div className="QueueStats-card">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title">[ High Priority Lane ]</span>
          <Flame className="QueueStats-icon" style={{ color: 'var(--status-lead-text)' }} />
        </div>
        <div className="QueueStats-card-body">
          <div className="QueueStats-metric-group">
            <span className="QueueStats-number">{stats.queuedHigh}</span>
            <span className="QueueStats-unit">waiting FIFO</span>
          </div>
          <p className="QueueStats-subtext">Dispatched ahead of low priority</p>
        </div>
      </div>

      {/* Low Priority Lane Card */}
      <div className="QueueStats-card">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title">[ Low Priority Lane ]</span>
          <Clock className="QueueStats-icon" />
        </div>
        <div className="QueueStats-card-body">
          <div className="QueueStats-metric-group">
            <span className="QueueStats-number">{stats.queuedLow}</span>
            <span className="QueueStats-unit">waiting FIFO</span>
          </div>
          <p className="QueueStats-subtext">Served when high lane is empty</p>
        </div>
      </div>

      {/* Worker Pool Card */}
      <div className="QueueStats-card">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title">[ Worker Thread Pool ]</span>
          <Cpu className="QueueStats-icon" style={{ color: 'var(--status-prospect-text)' }} />
        </div>
        <div className="QueueStats-card-body">
          <div className="QueueStats-metric-group">
            <span className="QueueStats-number">
              {stats.activeWorkers} / {stats.totalWorkers}
            </span>
            <span className="QueueStats-unit">threads active</span>
          </div>
          <div className="QueueStats-worker-bars">
            {stats.workers?.length > 0 ? (
              stats.workers.map((w) => (
                <span
                  key={w.index}
                  title={`${w.displayId}: ${w.isBusy ? 'Busy' : 'Idle'}`}
                  className={`QueueStats-worker-pill ${
                    w.isBusy ? 'QueueStats-worker-pill-busy' : ''
                  }`}
                />
              ))
            ) : (
              <span className="QueueStats-subtext">Fixed pool ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Completed Tasks Card */}
      <div className="QueueStats-card">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title">[ Completed Reductions ]</span>
          <CheckCircle2 className="QueueStats-icon" style={{ color: 'var(--status-active-text)' }} />
        </div>
        <div className="QueueStats-card-body">
          <div className="QueueStats-metric-group">
            <span className="QueueStats-number">{completed.length}</span>
            <span className="QueueStats-unit">files</span>
          </div>
          <p className="QueueStats-subtext">
            Sum: <span className="QueueStats-aggregate-sum">{Number(totalSum.toFixed(2)).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
