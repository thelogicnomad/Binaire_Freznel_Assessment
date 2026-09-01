import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import { Copy, Check, RefreshCw, X } from 'lucide-react';
import { formatClientId } from '../../utils/clientId';

export function Header({ clientId, onResetClientId, isConnected }) {
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isMenuOpen]);

  return (
    <header className="Header-root">
      <div className="Header-container">
        {/* Left: Binaire Logo SVG */}
        <div className="Header-left-corner">
          <svg
            className="Header-binaire-svg"
            viewBox="0 0 5421 395"
            fill="#000000"
            style={{
              fillRule: 'evenodd',
              clipRule: 'evenodd',
              strokeLinejoin: 'round',
              strokeMiterlimit: 2,
            }}
            aria-label="BINAIRE Logo"
          >
            <g transform="matrix(1.17643,0,0,1.17643,918.197,395.009)">
              <g transform="matrix(453.715,0,0,453.715,0,0)">
                <path
                  d="M0.844,-0.388C0.9,-0.377 0.942,-0.357 0.971,-0.33C1,-0.302 1.014,-0.262 1.014,-0.211L1.014,-0.207C1.014,-0.136 0.982,-0.084 0.918,-0.051C0.853,-0.017 0.765,-0 0.652,-0L0.035,-0L0.035,-0.74L0.698,-0.74C0.775,-0.739 0.837,-0.723 0.883,-0.692C0.929,-0.661 0.952,-0.616 0.952,-0.559L0.952,-0.555C0.952,-0.512 0.943,-0.476 0.925,-0.449C0.907,-0.422 0.88,-0.401 0.844,-0.388ZM0.554,-0.454C0.584,-0.454 0.606,-0.455 0.621,-0.457C0.636,-0.458 0.648,-0.463 0.659,-0.472C0.669,-0.48 0.674,-0.494 0.674,-0.514C0.674,-0.532 0.669,-0.545 0.66,-0.553C0.65,-0.561 0.637,-0.566 0.622,-0.568C0.606,-0.57 0.583,-0.571 0.554,-0.571L0.3,-0.571L0.3,-0.455L0.504,-0.454L0.554,-0.454ZM0.587,-0.187C0.622,-0.187 0.648,-0.188 0.666,-0.19C0.683,-0.192 0.697,-0.198 0.708,-0.207C0.718,-0.216 0.723,-0.23 0.723,-0.25C0.723,-0.269 0.718,-0.283 0.708,-0.292C0.697,-0.3 0.683,-0.305 0.666,-0.307C0.648,-0.309 0.622,-0.31 0.587,-0.31L0.3,-0.31L0.3,-0.188C0.387,-0.188 0.448,-0.188 0.484,-0.188C0.519,-0.187 0.542,-0.187 0.555,-0.187L0.587,-0.187Z"
                  style={{ fillRule: 'nonzero' }}
                />
              </g>
              <g transform="matrix(453.715,0,0,453.715,466.873,0)">
                <rect x="0.035" y="-0.74" width="0.285" height="0.74" style={{ fillRule: 'nonzero' }} />
              </g>
              <g transform="matrix(453.715,0,0,453.715,627.942,0)">
                <path
                  d="M0.32,-0L0.035,-0L0.035,-0.74L0.32,-0ZM1.015,-0L0.73,-0L1.015,-0ZM0.73,-0.323L0.73,-0.74L1.015,-0.74L1.015,-0L0.73,-0L0.32,-0.417L0.32,-0L0.035,-0L0.035,-0.74L0.32,-0.74L0.73,-0.323Z"
                  style={{ fillRule: 'nonzero' }}
                />
              </g>
              <g transform="matrix(453.715,0,0,453.715,1104.34,0)">
                <path
                  d="M1.062,-0L0.777,-0L0.716,-0.112L0.321,-0.112L0.26,-0L-0.025,-0L0.376,-0.74L0.661,-0.74L1.062,-0ZM0.519,-0.477L0.419,-0.294L0.618,-0.294L0.519,-0.477Z"
                  style={{ fillRule: 'nonzero' }}
                />
              </g>
              <g transform="matrix(453.715,0,0,453.715,1574.84,0)">
                <rect x="0.035" y="-0.74" width="0.285" height="0.74" style={{ fillRule: 'nonzero' }} />
              </g>
              <g transform="matrix(453.715,0,0,453.715,1735.91,0)">
                <path
                  d="M0.607,-0L0.402,-0.239L0.305,-0.239L0.305,-0L0.035,-0L0.035,-0.74L0.611,-0.74C0.673,-0.74 0.728,-0.73 0.776,-0.709C0.823,-0.688 0.86,-0.66 0.887,-0.623C0.913,-0.586 0.926,-0.543 0.926,-0.494L0.926,-0.49C0.926,-0.427 0.908,-0.374 0.871,-0.333C0.834,-0.292 0.782,-0.264 0.717,-0.25L0.932,-0L0.607,-0ZM0.663,-0.49C0.663,-0.51 0.659,-0.525 0.65,-0.534C0.641,-0.543 0.628,-0.548 0.614,-0.55C0.599,-0.552 0.576,-0.553 0.545,-0.553L0.513,-0.553C0.492,-0.552 0.423,-0.552 0.305,-0.552L0.305,-0.43L0.545,-0.43C0.576,-0.43 0.599,-0.431 0.614,-0.433C0.628,-0.435 0.641,-0.44 0.65,-0.449C0.659,-0.457 0.663,-0.471 0.663,-0.49Z"
                  style={{ fillRule: 'nonzero' }}
                />
              </g>
              <g transform="matrix(453.715,0,0,453.715,2165.58,0)">
                <path
                  d="M0.761,-0.274L0.32,-0.274L0.32,-0.197L0.845,-0.2L0.845,-0L0.035,-0L0.035,-0.74L0.845,-0.74L0.846,-0.54L0.32,-0.54L0.32,-0.469L0.761,-0.469L0.761,-0.274Z"
                  style={{ fillRule: 'nonzero' }}
                />
              </g>
            </g>
            <g transform="matrix(9.60938,0,0,9.60938,-158.555,-306.969)">
              <g>
                <g>
                  <g transform="matrix(8,0,0,0.9,-175.5,17.6)">
                    <rect x="25" y="16" width="3" height="10" />
                  </g>
                  <g transform="matrix(8,0,0,0.9,-175.5,49.6)">
                    <rect x="25" y="16" width="3" height="10" />
                  </g>
                  <g transform="matrix(2.66667,0,0,2.5,-50.1667,1.42109e-14)">
                    <rect x="25" y="16" width="3" height="10" />
                  </g>
                  <g transform="matrix(2.66667,0,0,2.5,-18.1667,1.42109e-14)">
                    <rect x="25" y="16" width="3" height="10" />
                  </g>
                </g>
                <g>
                  <g transform="matrix(2.66667,0,0,0.9,5.83333,17.6)">
                    <rect x="25" y="16" width="3" height="10" />
                  </g>
                  <g transform="matrix(2.66667,0,0,2.5,5.83333,8)">
                    <rect x="25" y="16" width="3" height="10" />
                  </g>
                  <g transform="matrix(2.66667,0,0,0.9,-2.16667,25.6)">
                    <rect x="25" y="16" width="3" height="10" />
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* Center: CSV QUEUE Tag */}
        <div className="Header-center-section">
          <span className="Header-brand-tag">[ CSV QUEUE ]</span>
        </div>

        {/* Right: Menu */}
        <div className="Header-right-corner">
          <div className="Header-menu-wrapper" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`Header-menu-btn ${isMenuOpen ? 'Header-menu-btn-active' : ''}`}
              aria-expanded={isMenuOpen}
              aria-label="Toggle Menu"
            >
              <span className="Header-menu-text">Menu</span>
              <div className="Header-hamburger-icon">
                <span className="Header-hamburger-line" />
                <span className="Header-hamburger-line" />
                <span className="Header-hamburger-line" />
              </div>
            </button>

            {isMenuOpen && (
              <div className="Header-dropdown-panel" role="menu">
                <div className="Header-dropdown-header">
                  <span className="Header-dropdown-title">[ Session & Network ]</span>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="Header-dropdown-close"
                    aria-label="Close"
                  >
                    <X className="Header-dropdown-close-icon" />
                  </button>
                </div>

                <div className="Header-dropdown-row">
                  <span className="Header-dropdown-label">Socket Connection</span>
                  <div className="Header-status-indicator">
                    <span
                      className={`Header-status-dot ${
                        isConnected ? 'Header-status-dot-online' : 'Header-status-dot-offline'
                      }`}
                    />
                    <span className="Header-status-value">
                      {isConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="Header-dropdown-row">
                  <span className="Header-dropdown-label">Client UUID</span>
                  <div className="Header-client-group">
                    <code className="Header-client-code">{formatClientId(clientId)}</code>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      title="Copy UUID"
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
                      title="New client session"
                      className="Header-control-btn"
                    >
                      <RefreshCw className="Header-control-icon" />
                    </button>
                  </div>
                </div>

                <div className="Header-dropdown-footer">
                  <span className="Header-footer-sub">Parallel All-Reduce Engine</span>
                  <span className="Header-footer-tag">Node.js worker_threads</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
