import React from 'react';
import './QueueList.css';
import { TaskCard } from '../TaskCard/TaskCard';

/**
 * Greentiq task list or empty state
 */
export function QueueList({ tasks, currentClientId, totalTasks = 0 }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="QueueList-empty-card">
        <svg
          className="QueueList-wireframe-svg"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <line x1="8" y1="24" x2="56" y2="24" stroke="currentColor" strokeWidth="1.5" />
          <line x1="20" y1="12" x2="20" y2="52" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="14" cy="18" r="2" fill="currentColor" />
          <line x1="28" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="1.5" />
          <line x1="28" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1.5" fill="var(--card)" />
          <path d="M46 50L49 53L55 47" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <h3 className="QueueList-empty-title">Queue Idle</h3>
        <p className="QueueList-empty-text">
          {totalTasks === 0
            ? 'No tasks currently scheduled. Upload one or more CSV files above to initiate parallel reduction.'
            : 'No files match the currently active filter or search parameter.'}
        </p>
        <span className="QueueList-empty-tag">[ Standby • Worker Pool Ready ]</span>
      </div>
    );
  }

  return (
    <div className="QueueList-container">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          currentClientId={currentClientId}
        />
      ))}
    </div>
  );
}
