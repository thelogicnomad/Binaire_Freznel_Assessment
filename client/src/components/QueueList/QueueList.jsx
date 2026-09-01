import React from 'react';
import './QueueList.css';
import { Inbox } from 'lucide-react';
import { TaskCard } from '../TaskCard/TaskCard';

/**
 * List rendering of TaskCard components or empty state
 */
export function QueueList({ tasks, currentClientId, totalTasks = 0 }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="QueueList-empty-state">
        <div className="QueueList-empty-icon-box">
          <Inbox className="QueueList-empty-icon" />
        </div>
        <h3 className="QueueList-empty-title">No tasks found</h3>
        <p className="QueueList-empty-text">
          {totalTasks === 0
            ? 'Upload one or more CSV files above to witness live priority queueing and worker thread reduction.'
            : 'No tasks match your active filter or search query.'}
        </p>
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
