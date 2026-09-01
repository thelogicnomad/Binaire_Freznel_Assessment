import React from 'react';
import {
  UploadCloud,
  FileCheck,
  ListOrdered,
  Hourglass,
  Cpu,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

export const STAGES = [
  { key: 'File uploading', label: '1. Uploading', icon: UploadCloud },
  { key: 'File uploaded', label: '2. Uploaded', icon: FileCheck },
  { key: 'File added to queue', label: '3. Enqueued', icon: ListOrdered },
  { key: 'Waiting for processing', label: '4. Waiting', icon: Hourglass },
  { key: 'Processing…', label: '5. Processing', icon: Cpu },
  { key: 'Completed', label: '6. Completed', icon: CheckCircle2 },
];

/**
 * Animated 6-step lifecycle tracker with distinct visual states
 */
export function StageTimeline({ currentStatus, progress = 0, workerId = null, error = null }) {
  const isFailed = currentStatus === 'Failed';

  const getCurrentIndex = () => {
    if (isFailed) return -1;
    const idx = STAGES.findIndex((s) => s.key === currentStatus);
    return idx !== -1 ? idx : 0;
  };

  const activeIndex = getCurrentIndex();

  if (isFailed) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
        <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="font-semibold">Processing Failed:</span>
        <span className="truncate">{error || 'An unexpected worker error occurred.'}</span>
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-6 gap-1 relative">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isPassed = idx < activeIndex || currentStatus === 'Completed';
          const isCurrent = idx === activeIndex && currentStatus !== 'Completed';
          const isUpcoming = idx > activeIndex;

          return (
            <div key={stage.key} className="flex flex-col items-center text-center relative group">
              {/* Connector line behind steps */}
              {idx < STAGES.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors duration-500 ${
                    idx < activeIndex
                      ? 'bg-emerald-500/80'
                      : idx === activeIndex
                      ? 'bg-gradient-to-r from-blue-500 to-slate-700'
                      : 'bg-slate-800'
                  }`}
                />
              )}

              {/* Step Circle Indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${
                  isPassed
                    ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110 shadow-lg shadow-blue-500/30 animate-pulse-subtle'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {isPassed && stage.key !== 'Completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon
                    className={`w-4 h-4 ${
                      isCurrent && stage.key === 'Processing…'
                        ? 'animate-spin'
                        : isCurrent && stage.key === 'Waiting for processing'
                        ? 'animate-bounce'
                        : ''
                    }`}
                  />
                )}
              </div>

              {/* Stage Title */}
              <span
                className={`mt-1.5 text-[11px] font-medium tracking-tight transition-colors truncate max-w-full ${
                  isCurrent
                    ? 'text-blue-300 font-bold'
                    : isPassed
                    ? 'text-emerald-400/90'
                    : 'text-slate-500'
                }`}
              >
                {stage.label}
              </span>

              {/* Contextual stage micro-badge */}
              {isCurrent && stage.key === 'Waiting for processing' && workerId && (
                <span className="mt-0.5 text-[9px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/50 truncate max-w-full font-mono animate-fadeIn">
                  {workerId.split(' ')[0]}
                </span>
              )}

              {isCurrent && stage.key === 'Processing…' && (
                <span className="mt-0.5 text-[9px] font-mono font-bold text-amber-300 px-1 py-0.5 rounded bg-amber-950/60 border border-amber-700/50">
                  {progress}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
