import React from 'react';
import './StagedFileList.css';
import { FileSpreadsheet, Trash2, ArrowRight } from 'lucide-react';

/**
 * Greentiq staged files list
 */
export function StagedFileList({ files, onTogglePriority, onRemoveFile }) {
  if (!files || files.length === 0) return null;

  return (
    <div className="StagedFileList-container">
      <div className="StagedFileList-header">
        <span>[ Staged Files: {files.length} ]</span>
        <span>Priority Setting</span>
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
                  item.priority === 'high' ? 'StagedFileList-priority-high' : ''
                }`}
                title={`Toggle priority (Currently ${item.priority.toUpperCase()})`}
              >
                <span>[ {item.priority === 'high' ? 'High Priority' : 'Low Priority'} ]</span>
                <ArrowRight className="StagedFileList-btn-icon" />
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
