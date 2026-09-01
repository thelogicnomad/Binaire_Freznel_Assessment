import React from 'react';
import './QueueFilter.css';
import { Search } from 'lucide-react';

/**
 * Greentiq filter tab bar and search input
 */
export function QueueFilter({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
}) {
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
    </div>
  );
}
