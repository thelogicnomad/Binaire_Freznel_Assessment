import React from 'react';
import './StatusBadge.css';
import { formatClientId } from '../../utils/clientId';

/**
 * Editorial bracket-style tag: [ High ] [ Low ] [ You ] [ Worker #1 ]
 */
export function StatusBadge({ type, label, clientId, workerId }) {
  if (type === 'priority-high') {
    return (
      <span className="StatusBadge-tag StatusBadge-high">
        <span className="StatusBadge-brackets">[</span> {label || 'High'} <span className="StatusBadge-brackets">]</span>
      </span>
    );
  }

  if (type === 'priority-low') {
    return (
      <span className="StatusBadge-tag">
        <span className="StatusBadge-brackets">[</span> {label || 'Low'} <span className="StatusBadge-brackets">]</span>
      </span>
    );
  }

  if (type === 'owner-you') {
    return (
      <span className="StatusBadge-tag StatusBadge-you">
        <span className="StatusBadge-brackets">[</span> You <span className="StatusBadge-brackets">]</span>
      </span>
    );
  }

  if (type === 'owner-other') {
    return (
      <span
        className="StatusBadge-tag"
        title={`Submitted by client ${clientId}`}
      >
        <span className="StatusBadge-brackets">[</span> {formatClientId(clientId)} <span className="StatusBadge-brackets">]</span>
      </span>
    );
  }

  if (type === 'worker') {
    return (
      <span className="StatusBadge-tag StatusBadge-worker">
        <span className="StatusBadge-brackets">[</span> {workerId} <span className="StatusBadge-brackets">]</span>
      </span>
    );
  }

  return (
    <span className="StatusBadge-tag">
      <span className="StatusBadge-brackets">[</span> {label} <span className="StatusBadge-brackets">]</span>
    </span>
  );
}
