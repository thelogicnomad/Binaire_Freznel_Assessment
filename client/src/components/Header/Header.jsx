import React, { useState } from 'react';
import './Header.css';
import { Layers, Wifi, WifiOff, Copy, Check, UserCheck, RefreshCw, Cpu } from 'lucide-react';
import { formatClientId } from '../../utils/clientId';

/**
 * Top navigation header with client identity session card and connection indicators
 */
export function Header({ clientId, onResetClientId, isConnected, stats }) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="Header-root">
      <div className="Header-container">
        {/* Brand & System Title */}
        <div className="Header-brand-wrapper">
          <div className="Header-brand">
            <div className="Header-logo-box">
              <Layers className="Header-logo-icon" />
            </div>
            <div className="Header-brand-text">
              <div className="Header-title-row">
                <h1 className="Header-title">CSV Queue Engine</h1>
                <span className="Header-tag">All-Reduce</span>
              </div>
              <p className="Header-subtitle">Multi-User Priority Scheduling & Worker Threads</p>
            </div>
          </div>
        </div>

        {/* Client Identity & Stats Bar */}
        <div className="Header-actions-bar">
          {/* Worker threads metric */}
          <div className="Header-workers-pill">
            <Cpu className="Header-btn-icon" style={{ color: 'var(--color-blue)' }} />
            <span>Workers:</span>
            <span className="Header-workers-count">
              {stats.activeWorkers} / {stats.totalWorkers} busy
            </span>
          </div>

          {/* Connection Status Badge */}
          <div
            className={`Header-connection-pill ${
              isConnected
                ? 'Header-connection-connected'
                : 'Header-connection-disconnected'
            }`}
          >
            {isConnected ? (
              <>
                <span className="Header-connection-dot Header-dot-green" />
                <span>Socket Connected</span>
              </>
            ) : (
              <>
                <span className="Header-connection-dot Header-dot-red" />
                <span>Disconnected</span>
              </>
            )}
          </div>

          {/* Persistent Client ID Session Tag */}
          <div className="Header-client-tag">
            <UserCheck className="Header-btn-icon" style={{ color: 'var(--color-indigo)' }} />
            <span className="Header-client-label">Your ID:</span>
            <span className="Header-client-id">{formatClientId(clientId)}</span>
            <button
              type="button"
              onClick={handleCopyId}
              title="Copy Full Client UUID"
              className="Header-icon-btn"
            >
              {copied ? (
                <Check className="Header-btn-icon" style={{ color: 'var(--color-emerald)' }} />
              ) : (
                <Copy className="Header-btn-icon" />
              )}
            </button>
            <button
              type="button"
              onClick={onResetClientId}
              title="Simulate New Client (Generates new session UUID)"
              className="Header-icon-btn Header-icon-btn-amber"
            >
              <RefreshCw className="Header-btn-icon" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
