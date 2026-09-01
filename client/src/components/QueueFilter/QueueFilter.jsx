import React, { useState, useEffect } from 'react';
import './QueueFilter.css';
import { Search, Trash2, AlertTriangle, X } from 'lucide-react';

/**
 * Greentiq filter tab bar, search input, and Clear All action with Confirmation Dialog
 */
export function QueueFilter({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
  onClearAll,
}) {
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

  const handleConfirmClear = () => {
    if (onClearAll) {
      onClearAll();
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="QueueFilter-container">
      {/* Tabs with var(--radius) */}
      <div className="QueueFilter-tabs-wrapper">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'all' ? 'QueueFilter-tab-active' : ''
          }`}
        >
          [ All Tasks: {counts.total} ]
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('mine')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'mine' ? 'QueueFilter-tab-active' : ''
          }`}
        >
          [ My Uploads: {counts.mine} ]
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('active')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'active' ? 'QueueFilter-tab-active' : ''
          }`}
        >
          [ In Flight: {counts.active} ]
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('high')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'high' ? 'QueueFilter-tab-active' : ''
          }`}
        >
          [ High Priority: {counts.high} ]
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('completed')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'completed' ? 'QueueFilter-tab-active' : ''
          }`}
        >
          [ Completed ]
        </button>

        {/* Clear All Button matching TaskCard remove styling */}
        {counts.mine > 0 && onClearAll && (
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="QueueFilter-clear-all-btn"
            title="Clear all tasks submitted by my client"
            aria-label="Clear All Tasks"
          >
            <Trash2 className="QueueFilter-clear-icon" />
            <span>[ Clear All ({counts.mine}) ]</span>
          </button>
        )}
      </div>

      {/* Search Input with var(--input) border and var(--ring) focus */}
      <div className="QueueFilter-search-wrapper">
        <Search className="QueueFilter-search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by file or client ID..."
          className="QueueFilter-search-input"
        />
      </div>

      {/* Confirmation Dialog Modal */}
      {isConfirmOpen && (
        <div
          className="QueueFilter-modal-backdrop"
          onClick={() => setIsConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Clear All Confirmation"
        >
          <div
            className="QueueFilter-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="QueueFilter-modal-header">
              <div className="QueueFilter-modal-title-group">
                <div className="QueueFilter-modal-icon-box">
                  <AlertTriangle className="QueueFilter-modal-icon" />
                </div>
                <h3 className="QueueFilter-modal-title">Clear All Tasks?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="QueueFilter-modal-close-btn"
                title="Cancel and close"
                aria-label="Close"
              >
                <X className="QueueFilter-clear-icon" />
              </button>
            </div>

            <p className="QueueFilter-modal-body">
              Are you sure you want to remove all <strong>{counts.mine}</strong> task(s) submitted by your client? Any waiting queue jobs will be cancelled and all reduction results will be cleared.
            </p>

            <div className="QueueFilter-modal-actions">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="QueueFilter-modal-btn-cancel"
              >
                [ Cancel ]
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="QueueFilter-modal-btn-confirm"
              >
                <Trash2 className="QueueFilter-clear-icon" />
                <span>[ Confirm & Clear All ]</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
