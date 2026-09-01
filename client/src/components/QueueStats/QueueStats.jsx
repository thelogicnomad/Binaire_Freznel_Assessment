import React from 'react';
import './QueueStats.css';
import { Flame, Clock, Cpu, CheckCircle2 } from 'lucide-react';

/**
 * Summary metrics cards for priority queues, worker pool, and completion stats
 */
export function QueueStats({ stats, tasks }) {
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const totalSystemSum = completedTasks.reduce((acc, t) => acc + (t.result || 0), 0);

  return (
    <div className="QueueStats-grid">
      {/* High Priority Lane Card */}
      <div className="QueueStats-card QueueStats-card-high">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title QueueStats-title-high">
            High Priority Lane
          </span>
          <div className="QueueStats-icon-box QueueStats-icon-box-high">
            <Flame className="QueueStats-icon" style={{ fill: '#f59e0b' }} />
          </div>
        </div>
        <div className="QueueStats-metric-group">
          <span className="QueueStats-number">{stats.queuedHigh}</span>
          <span className="QueueStats-unit">waiting FIFO</span>
        </div>
        <p className="QueueStats-subtext">Dispatched ahead of low priority</p>
      </div>

      {/* Low Priority Lane Card */}
      <div className="QueueStats-card">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title QueueStats-title-low">
            Low Priority Lane
          </span>
          <div className="QueueStats-icon-box QueueStats-icon-box-low">
            <Clock className="QueueStats-icon" />
          </div>
        </div>
        <div className="QueueStats-metric-group">
          <span className="QueueStats-number">{stats.queuedLow}</span>
          <span className="QueueStats-unit">waiting FIFO</span>
        </div>
        <p className="QueueStats-subtext">Served when high lane is empty</p>
      </div>

      {/* Worker Pool Activity Card */}
      <div className="QueueStats-card QueueStats-card-workers">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title QueueStats-title-workers">
            Worker Pool
          </span>
          <div className="QueueStats-icon-box QueueStats-icon-box-workers">
            <Cpu className="QueueStats-icon" />
          </div>
        </div>
        <div className="QueueStats-metric-group">
          <span className="QueueStats-number">
            {stats.activeWorkers} / {stats.totalWorkers}
          </span>
          <span className="QueueStats-unit" style={{ color: '#93c5fd' }}>threads busy</span>
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
            <span className="QueueStats-subtext">Fixed pool initialized</span>
          )}
        </div>
      </div>

      {/* Completed Tasks & Aggregate Sum Card */}
      <div className="QueueStats-card QueueStats-card-completed">
        <div className="QueueStats-card-header">
          <span className="QueueStats-card-title QueueStats-title-completed">
            Completed Tasks
          </span>
          <div className="QueueStats-icon-box QueueStats-icon-box-completed">
            <CheckCircle2 className="QueueStats-icon" />
          </div>
        </div>
        <div className="QueueStats-metric-group">
          <span className="QueueStats-number">{completedTasks.length}</span>
          <span className="QueueStats-unit" style={{ color: '#6ee7b7' }}>processed</span>
        </div>
        <p className="QueueStats-subtext">
          Aggregate Sum: <span className="QueueStats-aggregate-sum">{Number(totalSystemSum.toFixed(2)).toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}
