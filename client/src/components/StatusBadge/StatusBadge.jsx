import React from 'react';
import './StatusBadge.css';
import { formatClientId } from '../../utils/clientId';

/**
 * Greentiq status & attribute badge component
 */
export function StatusBadge({ type, label, clientId, workerId, status }) {
  if (type === 'priority-high') {
    return (
      <span className="StatusBadge-badge StatusBadge-priority-high">
        [ {label || 'High'} ]
      </span>
    );
  }

  if (type === 'priority-low') {
    return (
      <span className="StatusBadge-badge StatusBadge-priority-low">
        [ {label || 'Low'} ]
      </span>
    );
  }

  if (type === 'owner-you') {
    return (
      <span className="StatusBadge-badge StatusBadge-owner-you">
        [ You ]
      </span>
    );
  }

  if (type === 'owner-other') {
    return (
      <span
        className="StatusBadge-badge StatusBadge-owner-other"
        title={`Submitted by client ${clientId}`}
      >
        [ {formatClientId(clientId)} ]
      </span>
    );
  }

  if (type === 'worker') {
    return (
      <span className="StatusBadge-badge StatusBadge-worker">
        [ {workerId} ]
      </span>
    );
  }

  if (type === 'stage-status') {
    let statusClass = 'StatusBadge-status-uploaded';
    if (status === 'File added to queue') statusClass = 'StatusBadge-status-queued';
    else if (status === 'Waiting for processing') statusClass = 'StatusBadge-status-waiting';
    else if (status === 'Processing…') statusClass = 'StatusBadge-status-processing';
    else if (status === 'Completed') statusClass = 'StatusBadge-status-completed';
    else if (status === 'Failed') statusClass = 'StatusBadge-status-failed';

    return (
      <span className={`StatusBadge-badge ${statusClass}`}>
        [ {label || status} ]
      </span>
    );
  }

  return (
    <span className="StatusBadge-badge StatusBadge-priority-low">
      [ {label} ]
    </span>
  );
}
