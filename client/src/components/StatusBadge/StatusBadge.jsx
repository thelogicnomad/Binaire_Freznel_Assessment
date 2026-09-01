import React from 'react';
import './StatusBadge.css';
import { formatClientId } from '../../utils/clientId';

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
    let cls = 'StatusBadge-status-uploaded';
    if (status === 'File added to queue') cls = 'StatusBadge-status-queued';
    else if (status === 'Waiting for processing') cls = 'StatusBadge-status-waiting';
    else if (status === 'Processing…') cls = 'StatusBadge-status-processing';
    else if (status === 'Completed') cls = 'StatusBadge-status-completed';
    else if (status === 'Failed') cls = 'StatusBadge-status-failed';

    return (
      <span className={`StatusBadge-badge ${cls}`}>
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
