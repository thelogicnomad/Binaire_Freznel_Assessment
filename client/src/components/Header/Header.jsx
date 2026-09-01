import React, { useState } from 'react';
import './Header.css';
import { Layers, Copy, Check, RefreshCw } from 'lucide-react';
import { formatClientId } from '../../utils/clientId';

/**
 * Minimal and aesthetic navigation header
 */
export function Header({ clientId, onResetClientId, isConnected }) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="Header-root">
      <div className="Header-container">
        {/* Minimal Brand Identity */}
        <div className="Header-brand">
          <div className="Header-logo-box">
            <Layers className="Header-logo-icon" />
          </div>
          <div className="Header-brand-info">
            <span className="Header-title">CSV Queue Engine</span>
            <span className="Header-badge">all-reduce</span>
          </div>
        </div>

        {/* Minimal Actions & Status Bar */}
        <div className="Header-actions">
          {/* Subtle Live Status Indicator */}
          <div className="Header-status-badge">
            <span
              className={`Header-status-dot ${
                isConnected
                  ? 'Header-status-dot-online'
                  : 'Header-status-dot-offline'
              }`}
            />
            <span className="Header-status-text">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          <div className="Header-divider" />

          {/* Sleek Client Identity Tag */}
          <div className="Header-client-pill">
            <span className="Header-client-label">client:</span>
            <span className="Header-client-id">{formatClientId(clientId)}</span>
            <div className="Header-client-actions">
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Client ID"
                className="Header-action-btn"
                aria-label="Copy Client ID"
              >
                {copied ? (
                  <Check className="Header-action-icon Header-action-icon-check" />
                ) : (
                  <Copy className="Header-action-icon" />
                )}
              </button>
              <button
                type="button"
                onClick={onResetClientId}
                title="Generate New Client ID"
                className="Header-action-btn"
                aria-label="Reset Client ID"
              >
                <RefreshCw className="Header-action-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
