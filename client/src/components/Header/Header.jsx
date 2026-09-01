import React, { useState } from 'react';
import './Header.css';
import { Layers, Copy, Check, RefreshCw } from 'lucide-react';
import { formatClientId } from '../../utils/clientId';

/**
 * Greentiq navigation header
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
                <span className="Header-tag">[ All-Reduce ]</span>
              </div>
              <p className="Header-subtitle">Multi-User Priority Scheduling & Worker Thread Pool</p>
            </div>
          </div>
        </div>

        {/* Client Identity & Stats Bar */}
        <div className="Header-actions-bar">
          {/* Worker thread capacity pill */}
          <div className="Header-workers-pill">
            <span>[ Workers: {stats.activeWorkers}/{stats.totalWorkers} Active ]</span>
          </div>

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
    </header>
  );
}
