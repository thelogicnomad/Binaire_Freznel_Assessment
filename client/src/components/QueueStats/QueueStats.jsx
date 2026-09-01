import React from 'react';
import './QueueStats.css';
import { Flame, Clock, Cpu, CheckCircle2 } from 'lucide-react';

/**
 * Editorial monochrome system overview cards
 */
export function QueueStats({ stats, tasks }) {
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const totalSystemSum = completedTasks.reduce((acc, t) => acc + (t.result || 0), 0);

  return (
    <div className="QueueStats-grid">
      {/* High Priority Lane Card */}
      <div className="QueueStats-card">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title">[ High Priority Lane ]</span>
          <Flame className="QueueStats-icon" />
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

      {/* Worker Pool Activity Card */}
      <div className="QueueStats-card">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title">[ Worker Thread Pool ]</span>
          <Cpu className="QueueStats-icon" />
        </div>
        <div className="QueueStats-card-body">
          <div className="QueueStats-metric-group">
            <span className="QueueStats-number">
              {stats.activeWorkers} / {stats.totalWorkers}
            </span>
            <span className="QueueStats-unit">active</span>
          </div>
          <div className="QueueStats-worker-bars">
            {stats.workers && stats.workers.length > 0 ? (
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

      {/* Completed Tasks & Aggregate Sum Card */}
      <div className="QueueStats-card">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title">[ Completed Reductions ]</span>
          <CheckCircle2 className="QueueStats-icon" />
        </div>
        <div className="QueueStats-card-body">
          <div className="QueueStats-metric-group">
            <span className="QueueStats-number">{completedTasks.length}</span>
            <span className="QueueStats-unit">files</span>
          </div>
          <p className="QueueStats-subtext">
            Sum: <span className="QueueStats-aggregate-sum">{Number(totalSystemSum.toFixed(2)).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
