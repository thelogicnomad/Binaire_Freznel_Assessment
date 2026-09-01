import React from 'react';
import {
  FileText,
  Flame,
  Clock,
  User,
  Cpu,
  Calculator,
  CheckCircle,
  AlertCircle,
  Hash,
  Columns,
} from 'lucide-react';
import { StageTimeline } from './StageTimeline';
import { formatClientId } from '../utils/clientId';

/**
 * Format bytes into human readable string
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format numeric sums nicely with comma separators
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-US', {
    maximumFractionDigits: 4,
  });
}

export function TaskCard({ task, currentClientId }) {
  const isOwner = task.clientId === currentClientId;
  const isHighPriority = task.priority === 'high';
  const isCompleted = task.status === 'Completed';
  const isProcessing = task.status === 'Processing…';
  const isWaiting = task.status === 'Waiting for processing';
  const isFailed = task.status === 'Failed';

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 relative overflow-hidden ${
        isCompleted
          ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
          : isProcessing
          ? 'bg-slate-900/90 border-blue-500/50 shadow-lg shadow-blue-950/40 glow-active'
          : isFailed
          ? 'bg-slate-900/80 border-rose-800/60'
          : isHighPriority
          ? 'bg-slate-900/70 border-amber-500/30'
          : 'bg-slate-900/50 border-slate-800/80'
      }`}
    >
      {/* Background accent highlight for high priority */}
      {isHighPriority && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Top Bar: Priority Badge, User Tag, and File Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Priority Badge */}
          {isHighPriority ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              HIGH PRIORITY
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              LOW PRIORITY
            </span>
          )}

          {/* Submitter Ownership Badge */}
          {isOwner ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-700/60">
              <User className="w-3 h-3 text-emerald-400" />
              You
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-slate-400 bg-slate-800/60 border border-slate-700/40"
              title={`Submitted by client ${task.clientId}`}
            >
              <User className="w-3 h-3 text-slate-500" />
              {formatClientId(task.clientId)}
            </span>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[11px] font-mono text-slate-400">
          {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Main File Title & Info */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg border ${
              isCompleted
                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-400'
                : isProcessing
                ? 'bg-blue-950/40 border-blue-700/50 text-blue-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight break-all">
              {task.originalName}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {formatBytes(task.fileSize)} • ID: {task.id.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Assigned Worker Badge (Observable in Waiting and Processing stages) */}
        {task.assignedWorkerId && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs text-blue-300 font-mono shrink-0">
            <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="font-medium">{task.assignedWorkerId}</span>
          </div>
        )}
      </div>

      {/* 6-Stage Visual Timeline Stepper */}
      <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60 mb-4">
        <StageTimeline
          currentStatus={task.status}
          progress={task.progress}
          workerId={task.assignedWorkerId}
          error={task.error}
        />
      </div>

      {/* Active Processing Live Progress Bar */}
      {isProcessing && (
        <div className="mb-4 bg-slate-950/60 rounded-xl p-3 border border-blue-900/40">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-blue-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Summing numeric values in worker thread...
            </span>
            <span className="font-mono font-bold text-blue-200">{task.progress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <span>Rows parsed: {task.rows.toLocaleString()}</span>
            <span>Numbers summed: {task.numericCount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Final Sum Completed Result Banner */}
      {isCompleted && (
        <div className="bg-gradient-to-br from-emerald-950/50 to-teal-950/30 rounded-xl p-4 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                All-Reduce Final Sum
              </span>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {formatNumber(task.result)}
              </div>
            </div>
          </div>

          {/* Granular Stats */}
          <div className="grid grid-cols-3 gap-3 w-full sm:w-auto text-xs text-slate-300 border-t sm:border-t-0 sm:border-l border-emerald-900/50 pt-2 sm:pt-0 sm:pl-4">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Rows</span>
              <span className="font-mono font-semibold text-emerald-200">
                {task.rows.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Columns</span>
              <span className="font-mono font-semibold text-emerald-200">
                {task.columns || '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Values</span>
              <span className="font-mono font-semibold text-emerald-200">
                {task.numericCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
