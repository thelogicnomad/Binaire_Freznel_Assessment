import React, { useState } from 'react';
import './App.css';
import { Header } from './components/Header/Header';
import { CompletionBanner } from './components/CompletionBanner/CompletionBanner';
import { QueueStats } from './components/QueueStats/QueueStats';
import { FileUpload } from './components/FileUpload/FileUpload';
import { QueueDashboard } from './components/QueueDashboard/QueueDashboard';
import { useQueueSocket } from './hooks/useQueueSocket';
import { getClientId, resetClientId } from './utils/clientId';

export default function App() {
  const [clientId, setClientId] = useState(() => getClientId());

  const {
    isConnected,
    tasks,
    stats,
    activeToast,
    clearToast,
    addOptimisticTasks,
    resolveOptimisticTasks,
    removeTask,
    clearAllTasks,
  } = useQueueSocket(clientId);

  const handleResetClientId = () => {
    const newId = resetClientId();
    setClientId(newId);
  };

  return (
    <div className="App-container">
      {/* Greentiq Header with Info Toggletip */}
      <Header
        clientId={clientId}
        onResetClientId={handleResetClientId}
        isConnected={isConnected}
      />

      {/* Floating Top-Right Toast Notification (for completions, deletions, and queue actions) */}
      <CompletionBanner
        toast={activeToast}
        onDismiss={clearToast}
      />

      {/* Main Content Area */}
      <main className="App-main">
        {/* Section 1: System Metrics */}
        <div className="App-section-wrapper">
          <div className="App-section-divider">
            <div className="App-section-rule" />
            <span className="App-section-label">[ System Capacity & Queue Lanes ]</span>
            <div className="App-section-rule" />
          </div>
          <QueueStats stats={stats} tasks={tasks} />
        </div>

        {/* Section 2: Upload Zone */}
        <div className="App-section-wrapper">
          <div className="App-section-divider">
            <div className="App-section-rule" />
            <span className="App-section-label">[ Ingest & Priority Dispatch ]</span>
            <div className="App-section-rule" />
          </div>
          <FileUpload
            clientId={clientId}
            onUploadStart={(optimistic) => addOptimisticTasks(optimistic)}
            onUploadSuccess={(tempIds, serverTasks) => resolveOptimisticTasks(tempIds, serverTasks)}
            onUploadError={(tempIds, err) => {
              console.error('Upload Error:', err);
            }}
          />
        </div>

        {/* Section 3: Live Dashboard */}
        <div className="App-section-wrapper">
          <div className="App-section-divider">
            <div className="App-section-rule" />
            <span className="App-section-label">[ Real-Time Queue Monitor ]</span>
            <div className="App-section-rule" />
          </div>
          <QueueDashboard
            tasks={tasks}
            currentClientId={clientId}
            onRemoveTask={removeTask}
            onClearAll={clearAllTasks}
          />
        </div>
      </main>

      {/* Greentiq Footer */}
      <footer className="App-footer">
        <div className="App-footer-content">
          <p className="App-footer-title">
            CSV Multi-User Queue Engine — Parallel All-Reduce
          </p>
          <p className="App-footer-sub">
            [ Node.js worker_threads • Express • Socket.io • React Vite ]
          </p>
        </div>
      </footer>
    </div>
  );
}
