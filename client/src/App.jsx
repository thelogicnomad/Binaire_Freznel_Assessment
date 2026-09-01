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

  const handleResetId = () => {
    const next = resetClientId();
    setClientId(next);
  };

  return (
    <div className="App-container">
      <Header
        clientId={clientId}
        onResetClientId={handleResetId}
        isConnected={isConnected}
      />

      <CompletionBanner
        toast={activeToast}
        onDismiss={clearToast}
      />

      <main className="App-main">
        <div className="App-section-wrapper">
          <div className="App-section-divider">
            <div className="App-section-rule" />
            <span className="App-section-label">[ System Capacity & Queue Lanes ]</span>
            <div className="App-section-rule" />
          </div>
          <QueueStats stats={stats} tasks={tasks} />
        </div>

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
            onUploadError={(_tempIds, err) => {
              console.error('Upload Error:', err);
            }}
          />
        </div>

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
