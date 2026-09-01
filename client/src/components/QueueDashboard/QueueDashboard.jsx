import React, { useState, useMemo } from 'react';
import './QueueDashboard.css';
import { QueueFilter } from '../QueueFilter/QueueFilter';
import { QueueList } from '../QueueList/QueueList';

/**
 * Queue visualizer dashboard container
 */
export function QueueDashboard({ tasks, currentClientId }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = task.originalName?.toLowerCase().includes(query);
        const matchClient = task.clientId?.toLowerCase().includes(query);
        const matchWorker = task.assignedWorkerId?.toLowerCase().includes(query);
        if (!matchName && !matchClient && !matchWorker) return false;
      }

      if (filter === 'mine') return task.clientId === currentClientId;
      if (filter === 'high') return task.priority === 'high';
      if (filter === 'low') return task.priority === 'low';
      if (filter === 'active') {
        return (
          task.status !== 'Completed' &&
          task.status !== 'Failed'
        );
      }
      if (filter === 'completed') return task.status === 'Completed';

      return true;
    });
  }, [tasks, filter, searchQuery, currentClientId]);

  const counts = {
    total: tasks.length,
    mine: tasks.filter((t) => t.clientId === currentClientId).length,
    high: tasks.filter((t) => t.priority === 'high').length,
    active: tasks.filter(
      (t) => t.status !== 'Completed' && t.status !== 'Failed'
    ).length,
  };

  return (
    <div className="QueueDashboard-container">
      <QueueFilter
        activeFilter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      <QueueList
        tasks={filteredTasks}
        currentClientId={currentClientId}
        totalTasks={tasks.length}
      />
    </div>
  );
}
