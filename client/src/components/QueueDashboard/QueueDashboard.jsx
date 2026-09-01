import React, { useState, useMemo, useEffect } from 'react';
import './QueueDashboard.css';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { QueueFilter } from '../QueueFilter/QueueFilter';
import { QueueList } from '../QueueList/QueueList';

/**
 * Queue visualizer dashboard container with Clear All action positioned above the container
 */
export function QueueDashboard({ tasks, currentClientId, onRemoveTask, onClearAll }) {
  const [filter, setFilter] = useState('all');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Close confirmation modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isConfirmOpen) {
        setIsConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmOpen]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
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
  }, [tasks, filter, currentClientId]);

  const counts = {
    total: tasks.length,
    mine: tasks.filter((t) => t.clientId === currentClientId).length,
    high: tasks.filter((t) => t.priority === 'high').length,
    active: tasks.filter(
      (t) => t.status !== 'Completed' && t.status !== 'Failed'
    ).length,
    completedMine: tasks.filter(
      (t) => t.clientId === currentClientId && (t.status === 'Completed' || t.status === 'Failed')
    ).length,
  };

  const handleConfirmClear = () => {
    if (onClearAll) {
      onClearAll();
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="QueueDashboard-container">
      {/* Clear All Action positioned outside and above the container */}
      {counts.mine > 0 && onClearAll && (
        <div className="QueueDashboard-top-action-bar">
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="QueueDashboard-clear-btn"
            title="Clear all tasks submitted by my client"
            aria-label="Clear All Tasks"
          >
            <Trash2 className="QueueDashboard-clear-icon" />
            <span>Clear All ({counts.mine})</span>
          </button>
        </div>
      )}

      {/* Filter Bar Container */}
      <QueueFilter
        activeFilter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />

      {/* Tasks List */}
      <QueueList
        tasks={filteredTasks}
        currentClientId={currentClientId}
        totalTasks={tasks.length}
        onRemoveTask={onRemoveTask}
      />

      {/* Confirmation Dialog Modal */}
      {isConfirmOpen && (
        <div
          className="QueueDashboard-modal-backdrop"
          onClick={() => setIsConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Clear All Confirmation"
        >
          <div
            className="QueueDashboard-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="QueueDashboard-modal-header">
              <div className="QueueDashboard-modal-title-group">
                <div className="QueueDashboard-modal-icon-box">
                  <AlertTriangle className="QueueDashboard-modal-icon" />
                </div>
                <h3 className="QueueDashboard-modal-title">Clear All Tasks?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="QueueDashboard-modal-close-btn"
                title="Cancel and close"
                aria-label="Close"
              >
                <X className="QueueDashboard-clear-icon" />
              </button>
            </div>

            <p className="QueueDashboard-modal-body">
              Are you sure you want to remove all <strong>{counts.mine}</strong> task(s) submitted by your client? Any waiting queue jobs will be cancelled and all reduction results will be cleared.
            </p>

            <div className="QueueDashboard-modal-actions">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="QueueDashboard-modal-btn-cancel"
              >
                [ Cancel ]
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="QueueDashboard-modal-btn-confirm"
              >
                <Trash2 className="QueueDashboard-clear-icon" />
                <span>[ Confirm & Clear All ]</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
