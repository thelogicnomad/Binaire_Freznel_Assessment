import React from 'react';
import './StatusBadge.css';
import { Flame, Clock, User, Cpu } from 'lucide-react';
import { formatClientId } from '../../utils/clientId';

/**
 * Reusable status and attribute badge
 */
export function StatusBadge({ type, label, clientId, workerId }) {
  if (type === 'priority-high') {
    return (
      <span className="StatusBadge-badge StatusBadge-high">
        <Flame className="StatusBadge-icon StatusBadge-icon-flame" />
        {label || 'HIGH PRIORITY'}
      </span>
    );
  }

  if (type === 'priority-low') {
    return (
      <span className="StatusBadge-badge StatusBadge-low">
        <Clock className="StatusBadge-icon" />
        {label || 'LOW PRIORITY'}
      </span>
    );
  }

  if (type === 'owner-you') {
    return (
      <span className="StatusBadge-badge StatusBadge-owner-you">
        <User className="StatusBadge-icon" />
        You
      </span>
    );
  }

  if (type === 'owner-other') {
    return (
      <span
        className="StatusBadge-badge StatusBadge-owner-other"
        title={`Submitted by client ${clientId}`}
      >
        <User className="StatusBadge-icon" />
        {formatClientId(clientId)}
      </span>
    );
  }

  if (type === 'worker') {
    return (
      <span className="StatusBadge-badge StatusBadge-worker">
        <Cpu className="StatusBadge-icon StatusBadge-icon-pulse" />
        {workerId}
      </span>
    );
  }

  return (
    <span className="StatusBadge-badge StatusBadge-low">
      {label}
    </span>
  );
}
