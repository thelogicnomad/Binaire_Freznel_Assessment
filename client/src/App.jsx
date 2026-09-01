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
      {/* Greentiq Header */}
      <Header
        clientId={clientId}
        onResetClientId={handleResetClientId}
        isConnected={isConnected}
        stats={stats}
      />

      {/* Completion Toast Banner */}
      <CompletionBanner
        task={lastCompletedTask}
        onDismiss={clearLastCompleted}
      />

      {/* Main Content Area */}
      <main className="App-main">
        {/* Hero Overview Panel */}
        <div className="App-hero-panel">
          <div className="App-hero-content">
            <span className="App-hero-eyebrow">[ Distributed Architecture ]</span>
            <h2 className="App-hero-heading">
              Parallel All-Reduce Reduction Engine
            </h2>
            <p className="App-hero-description">
              Upload multiple CSV files with High or Low priority tags. Jobs are scheduled into strict priority FIFO lanes and reduced across dedicated Node.js worker threads in real time.
            </p>
          </div>

          {/* Line-Art Architecture Diagram */}
          <div className="App-hero-wireframe-wrapper">
            <svg
              className="App-hero-wireframe-svg"
              viewBox="0 0 200 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="180" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              <line x1="20" y1="70" x2="180" y2="70" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              <line x1="20" y1="120" x2="180" y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

              {/* Ingest Node */}
              <rect x="25" y="55" width="30" height="30" rx="4" stroke="currentColor" strokeWidth="1.5" fill="var(--secondary)" />
              <circle cx="40" cy="70" r="4" fill="currentColor" />
              
              {/* Distribution Channels */}
              <path d="M55 70H85M85 70L115 35M85 70L115 70M85 70L115 105" stroke="currentColor" strokeWidth="1.5" />

              {/* Worker Nodes */}
              <rect x="115" y="20" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" fill="var(--card)" />
              <text x="123" y="38" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">W1</text>

              <rect x="115" y="56" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" fill="var(--card)" />
              <text x="123" y="74" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">W2</text>

              <rect x="115" y="92" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" fill="var(--card)" />
              <text x="123" y="110" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">WN</text>

              {/* Reduction Reducer */}
              <path d="M143 34L165 70M143 70H165M143 106L165 70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="175" cy="70" r="10" stroke="currentColor" strokeWidth="1.5" fill="var(--secondary)" />
              <path d="M171 70H179M175 66V74" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

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
          <QueueDashboard tasks={tasks} currentClientId={clientId} />
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
