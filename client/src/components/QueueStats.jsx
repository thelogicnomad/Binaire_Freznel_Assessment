import React from 'react';
import { Flame, Clock, Cpu, CheckCircle2, Server } from 'lucide-react';

export function QueueStats({ stats, tasks }) {
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const totalSystemSum = completedTasks.reduce((acc, t) => acc + (t.result || 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* High Priority Lane Card */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-amber-500/30 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            High Priority Lane
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            {stats.queuedHigh}
          </span>
          <span className="text-xs text-slate-400">waiting FIFO</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Dispatched ahead of low priority</p>
      </div>

      {/* Low Priority Lane Card */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Low Priority Lane
          </span>
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            {stats.queuedLow}
          </span>
          <span className="text-xs text-slate-400">waiting FIFO</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Served when high lane is empty</p>
      </div>

      {/* Worker Pool Activity Card */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Worker Pool
          </span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            {stats.activeWorkers} / {stats.totalWorkers}
          </span>
          <span className="text-xs text-blue-300">threads busy</span>
        </div>
        {/* Worker slots visual indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          {stats.workers && stats.workers.length > 0 ? (
            stats.workers.map((w) => (
              <span
                key={w.index}
                title={`${w.displayId}: ${w.isBusy ? 'Busy' : 'Idle'}`}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  w.isBusy ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'
                }`}
              />
            ))
          ) : (
            <span className="text-[10px] text-slate-400">Fixed pool initialized</span>
          )}
        </div>
      </div>

      {/* Completed Tasks & Aggregate Sum Card */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-emerald-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Completed Tasks
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            {completedTasks.length}
          </span>
          <span className="text-xs text-emerald-300">processed</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          Aggregate Sum: <span className="font-mono text-emerald-300">{Number(totalSystemSum.toFixed(2)).toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}
