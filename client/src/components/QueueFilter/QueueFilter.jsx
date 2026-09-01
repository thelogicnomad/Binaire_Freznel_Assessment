import React from 'react';
import './QueueFilter.css';
import { Layers, User, Cpu, Flame, CheckCircle2, Search } from 'lucide-react';

/**
 * Filter tabs and search bar for the queue dashboard
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
      {/* Tabs */}
      <div className="QueueFilter-tabs-wrapper">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'all' ? 'QueueFilter-tab-active-all' : ''
          }`}
        >
          <Layers className="QueueFilter-tab-icon" />
          All Tasks ({counts.total})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('mine')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'mine' ? 'QueueFilter-tab-active-mine' : ''
          }`}
        >
          <User className="QueueFilter-tab-icon" />
          My Uploads ({counts.mine})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('active')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'active' ? 'QueueFilter-tab-active-active' : ''
          }`}
        >
          <Cpu className="QueueFilter-tab-icon" />
          In Flight ({counts.active})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('high')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'high' ? 'QueueFilter-tab-active-high' : ''
          }`}
        >
          <Flame className="QueueFilter-tab-icon" />
          High Priority ({counts.high})
        </button>

        <button
          type="button"
          onClick={() => onFilterChange('completed')}
          className={`QueueFilter-tab-btn ${
            activeFilter === 'completed' ? 'QueueFilter-tab-active-completed' : ''
          }`}
        >
          <CheckCircle2 className="QueueFilter-tab-icon" />
          Completed
        </button>
      </div>

      {/* Search Input */}
      <div className="QueueFilter-search-wrapper">
        <Search className="QueueFilter-search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by file or client..."
          className="QueueFilter-search-input"
        />
      </div>
    </div>
  );
}
