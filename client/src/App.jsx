import React, { useState } from 'react';
import { Header } from './components/Header';
import { QueueStats } from './components/QueueStats';
import { FileUpload } from './components/FileUpload';
import { QueueDashboard } from './components/QueueDashboard';
import { useQueueSocket } from './hooks/useQueueSocket';
import { getClientId, resetClientId } from './utils/clientId';
import { CheckCircle, X, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [clientId, setClientId] = useState(() => getClientId());

  const {
    isConnected,
    tasks,
    stats,
    lastCompletedTask,
    clearLastCompleted,
    addOptimisticTasks,
    resolveOptimisticTasks,
  } = useQueueSocket(clientId);

  const handleResetClientId = () => {
    const newId = resetClientId();
    setClientId(newId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Persistent Navigation Header */}
      <Header
        clientId={clientId}
        onResetClientId={handleResetClientId}
        isConnected={isConnected}
        stats={stats}
      />

      {/* Completion Celebration Notification Banner */}
      {lastCompletedTask && (
        <aside aria-label="Task completion notification" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full animate-fadeIn">
          <div className="bg-gradient-to-r from-emerald-950/80 via-teal-900/60 to-emerald-950/80 border border-emerald-500/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Reduction Complete!</span>
                  <span className="text-xs font-mono font-normal text-emerald-300">
                    ({lastCompletedTask.filename})
                  </span>
                </h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Sum calculated:{' '}
                  <strong className="font-mono text-white text-sm">
                    {Number(lastCompletedTask.result).toLocaleString('en-US', {
                      maximumFractionDigits: 4,
                    })}
                  </strong>{' '}
                  across {lastCompletedTask.rows?.toLocaleString()} rows in {lastCompletedTask.durationMs}ms.
                </p>
              </div>
            </div>
            <button
              onClick={clearLastCompleted}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* System Overview Stats Bar */}
        <QueueStats stats={stats} tasks={tasks} />

        {/* Upload Zone */}
        <FileUpload
          clientId={clientId}
          onUploadStart={(optimistic) => addOptimisticTasks(optimistic)}
          onUploadSuccess={(tempIds, serverTasks) => resolveOptimisticTasks(tempIds, serverTasks)}
          onUploadError={(tempIds, err) => {
            console.error('Upload Error:', err);
          }}
        />

        {/* Global Live Queue Dashboard */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Real-Time Queue Dashboard</h2>
              <p className="text-xs text-slate-400">
                Live broadcast of all tasks across all connected users
              </p>
            </div>
          </div>

          <QueueDashboard tasks={tasks} currentClientId={clientId} />
        </section>
      </main>

      {/* Technical Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-300">
            CSV Multi-User Queue Engine & Worker Threads All-Reduce
          </p>
          <p>
            Powered by Node.js <code className="text-blue-400">worker_threads</code>, Express, Socket.io, and React Vite
          </p>
        </div>
      </footer>
    </div>
  );
}
