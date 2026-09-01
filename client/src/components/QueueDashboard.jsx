import React, { useState, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import {
  ListFilter,
  Search,
  Flame,
  Clock,
  User,
  CheckCircle2,
  Cpu,
  Layers,
  Inbox,
} from 'lucide-react';

export function QueueDashboard({ tasks, currentClientId }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'mine' | 'high' | 'low' | 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = task.originalName?.toLowerCase().includes(query);
        const matchClient = task.clientId?.toLowerCase().includes(query);
        const matchWorker = task.assignedWorkerId?.toLowerCase().includes(query);
        if (!matchName && !matchClient && !matchWorker) return false;
      }

      // Tab filter
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

  // Counts for tab badges
  const myCount = tasks.filter((t) => t.clientId === currentClientId).length;
  const highCount = tasks.filter((t) => t.priority === 'high').length;
  const activeCount = tasks.filter(
    (t) => t.status !== 'Completed' && t.status !== 'Failed'
  ).length;

  return (
    <div className="space-y-4">
      {/* Filters & Search Header */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Tasks ({tasks.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'mine'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            My Uploads ({myCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'active'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            In Flight ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('high')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'high'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            High Priority ({highCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'completed'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file or client..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-12 text-center flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-slate-800 text-slate-500 mb-3">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No tasks found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {tasks.length === 0
              ? 'Upload one or more CSV files above to witness live priority queueing and worker thread reduction.'
              : 'No tasks match your active filter or search query.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentClientId={currentClientId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
