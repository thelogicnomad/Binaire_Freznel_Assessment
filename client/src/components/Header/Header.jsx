import React, { useState, useEffect } from 'react';
import './Header.css';
import { Layers, Copy, Check, RefreshCw, Info, X } from 'lucide-react';
import { formatClientId } from '../../utils/clientId';

/**
 * Greentiq navigation header with Info Toggletip Popover
 */
export function Header({ clientId, onResetClientId, isConnected }) {
  const [copied, setCopied] = useState(false);
  const [showArchInfo, setShowArchInfo] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showArchInfo) {
        setShowArchInfo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showArchInfo]);

  return (
    <header className="Header-root">
      <div className="Header-container">
        {/* Brand & System Title with Info Toggletip */}
        <div className="Header-brand-wrapper">
          <div className="Header-brand">
            <div className="Header-logo-box">
              <Layers className="Header-logo-icon" />
            </div>
            <div className="Header-brand-text">
              <div className="Header-title-row">
                <h1 className="Header-title">CSV Queue Engine</h1>
                <span className="Header-tag">[ All-Reduce ]</span>
                <button
                  type="button"
                  onClick={() => setShowArchInfo(true)}
                  className="Header-info-trigger-btn"
                  title="View Distributed Architecture Details"
                  aria-label="Architecture Information"
                >
                  <Info className="Header-info-icon" />
                </button>
              </div>
              <p className="Header-subtitle">Multi-User Priority Scheduling & Worker Thread Pool</p>
            </div>
          </div>
        </div>

        {/* Client Identity & Connection Bar */}
        <div className="Header-actions-bar">
          {/* Connection Status Bracket Pill */}
          <div
            className={`Header-connection-pill ${
              isConnected
                ? 'Header-connection-connected'
                : 'Header-connection-disconnected'
            }`}
          >
            <span>[ Socket: {isConnected ? 'Connected' : 'Offline'} ]</span>
          </div>

          {/* Persistent Client ID Tag with Copy & Reset */}
          <div className="Header-client-tag">
            <span>[ ID:</span>
            <span className="Header-client-id">{formatClientId(clientId)}</span>
            <span>]</span>
            <button
              type="button"
              onClick={handleCopyId}
              title="Copy Client UUID"
              className="Header-icon-btn"
            >
              {copied ? (
                <Check className="Header-btn-icon" />
              ) : (
                <Copy className="Header-btn-icon" />
              )}
            </button>
            <button
              type="button"
              onClick={onResetClientId}
              title="Simulate New Client (Generates new UUID)"
              className="Header-icon-btn"
            >
              <RefreshCw className="Header-btn-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Toggletip Modal / Popover */}
      {showArchInfo && (
        <div
          className="Header-toggletip-backdrop"
          onClick={() => setShowArchInfo(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Distributed Architecture"
        >
          <div
            className="Header-toggletip-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="Header-toggletip-header">
              <div>
                <span className="Header-toggletip-eyebrow">[ Distributed Architecture ]</span>
                <h2 className="Header-toggletip-title">
                  Parallel All-Reduce Reduction Engine
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowArchInfo(false)}
                className="Header-toggletip-close-btn"
                title="Close dialog"
                aria-label="Close"
              >
                <X className="Header-btn-icon" />
              </button>
            </div>

            <p className="Header-toggletip-body">
              Upload multiple CSV files with High or Low priority tags. Jobs are scheduled into strict priority FIFO lanes and reduced across dedicated Node.js worker threads in real time.
            </p>

            <div className="Header-toggletip-diagram">
              <svg
                className="Header-toggletip-svg"
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
        </div>
      )}
    </header>
  );
}
