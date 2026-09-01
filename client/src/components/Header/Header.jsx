import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import { Copy, Check, RefreshCw, X, Menu as MenuIcon } from 'lucide-react';
import { formatClientId } from '../../utils/clientId';

/**
 * Minimal editorial header inspired by Binaire design system
 */
export function Header({ clientId, onResetClientId, isConnected }) {
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="Header-root">
      <div className="Header-container">
        {/* Brand: Pixelated 01 Icon + Bold BINAIRE Logo */}
        <div className="Header-brand-section">
          <div className="Header-binaire-logo">
            {/* Pixelated 01 Binary Mark */}
            <svg
              className="Header-pixel-icon"
              viewBox="0 0 22 18"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Pixelated '0' */}
              <rect x="0" y="2" width="2.5" height="14" />
              <rect x="6.5" y="2" width="2.5" height="14" />
              <rect x="2.5" y="0" width="4" height="2.5" />
              <rect x="2.5" y="15.5" width="4" height="2.5" />

              {/* Pixelated '1' */}
              <rect x="12" y="3.5" width="2.5" height="2.5" />
              <rect x="14.5" y="0" width="2.5" height="18" />
              <rect x="11" y="15.5" width="8" height="2.5" />
            </svg>

            <span className="Header-brand-title">BINAIRE</span>
            <span className="Header-brand-tag">/ CSV QUEUE</span>
          </div>
        </div>

        {/* Right Navigation: Minimal "Menu ☰" Button & Dropdown */}
        <div className="Header-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`Header-menu-btn ${isMenuOpen ? 'Header-menu-btn-active' : ''}`}
            aria-expanded={isMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            <span className="Header-menu-text">Menu</span>
            <div className="Header-hamburger-icon">
              <span className="Header-hamburger-line" />
              <span className="Header-hamburger-line" />
              <span className="Header-hamburger-line" />
            </div>
          </button>

          {/* Minimal Editorial Dropdown Menu */}
          {isMenuOpen && (
            <div className="Header-dropdown-panel" role="menu">
              <div className="Header-dropdown-header">
                <span className="Header-dropdown-title">[ Session & Network ]</span>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="Header-dropdown-close"
                  aria-label="Close menu"
                >
                  <X className="Header-dropdown-close-icon" />
                </button>
              </div>

              {/* Socket Status */}
              <div className="Header-dropdown-row">
                <span className="Header-dropdown-label">Socket Connection</span>
                <div className="Header-status-indicator">
                  <span
                    className={`Header-status-dot ${
                      isConnected
                        ? 'Header-status-dot-online'
                        : 'Header-status-dot-offline'
                    }`}
                  />
                  <span className="Header-status-value">
                    {isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Client ID with Copy & Reset */}
              <div className="Header-dropdown-row">
                <span className="Header-dropdown-label">Client UUID</span>
                <div className="Header-client-group">
                  <code className="Header-client-code">{formatClientId(clientId)}</code>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copy full client UUID"
                    className="Header-control-btn"
                  >
                    {copied ? (
                      <Check className="Header-control-icon Header-control-icon-check" />
                    ) : (
                      <Copy className="Header-control-icon" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onResetClientId}
                    title="Simulate new client session"
                    className="Header-control-btn"
                  >
                    <RefreshCw className="Header-control-icon" />
                  </button>
                </div>
              </div>

              {/* Engine Specs */}
              <div className="Header-dropdown-footer">
                <span className="Header-footer-sub">Parallel All-Reduce Engine</span>
                <span className="Header-footer-tag">Node.js worker_threads</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
