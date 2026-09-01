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
    <div className="App-container">
      {/* Persistent Navigation Header */}
      <Header
        clientId={clientId}
        onResetClientId={handleResetClientId}
        isConnected={isConnected}
        stats={stats}
      />

      {/* Completion Celebration Notification Banner */}
      <CompletionBanner
        task={lastCompletedTask}
        onDismiss={clearLastCompleted}
      />

      {/* Main Content Area */}
      <main className="App-main">
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
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="App-section-header">
            <div>
              <h2 className="App-section-title">Real-Time Queue Dashboard</h2>
              <p className="App-section-subtitle">
                Live broadcast of all tasks across all connected users
              </p>
            </div>
          </div>

          <QueueDashboard tasks={tasks} currentClientId={clientId} />
        </section>
      </main>

      {/* Technical Footer */}
      <footer className="App-footer">
        <div className="App-footer-content">
          <p className="App-footer-highlight">
            CSV Multi-User Queue Engine & Worker Threads All-Reduce
          </p>
          <p>
            Powered by Node.js <code className="App-footer-code">worker_threads</code>, Express, Socket.io, and React Vite
          </p>
        </div>
      </footer>
    </div>
  );
}
