import React from 'react';
import './StagedFileList.css';
import { FileSpreadsheet, Trash2, Flame, Clock } from 'lucide-react';

/**
 * List of staged files pending upload
 */
export function StagedFileList({ files, onTogglePriority, onRemoveFile }) {
  if (!files || files.length === 0) return null;

  return (
    <div className="StagedFileList-container">
      <div className="StagedFileList-header">
        <span>Staged Files ({files.length})</span>
        <span>Configure Priority</span>
      </div>

      <div className="StagedFileList-list">
        {files.map((item) => (
          <div key={item.id} className="StagedFileList-item">
            <div className="StagedFileList-file-info">
              <FileSpreadsheet className="StagedFileList-file-icon" />
              <span className="StagedFileList-file-name" title={item.name}>
                {item.name}
              </span>
              <span className="StagedFileList-file-size">
                {(item.size / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="StagedFileList-actions">
              <button
                type="button"
                onClick={() => onTogglePriority(item.id)}
                className={`StagedFileList-priority-btn ${
                  item.priority === 'high'
                    ? 'StagedFileList-priority-high'
                    : 'StagedFileList-priority-low'
                }`}
                title={`Click to switch to ${item.priority === 'high' ? 'Low' : 'High'} priority`}
              >
                {item.priority === 'high' ? (
                  <>
                    <Flame className="StagedFileList-btn-icon" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <span>High</span>
                  </>
                ) : (
                  <>
                    <Clock className="StagedFileList-btn-icon" />
                    <span>Low</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onRemoveFile(item.id)}
                className="StagedFileList-remove-btn"
                title="Remove file"
              >
                <Trash2 className="StagedFileList-btn-icon" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
