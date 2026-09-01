import React, { useRef } from 'react';
import './DropZone.css';
import { UploadCloud } from 'lucide-react';

export function DropZone({ onFilesAdded, isDragging, onDragOver, onDragLeave, onDrop }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    if (e.target.files?.length > 0) {
      onFilesAdded(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div
      className={`DropZone-container ${isDragging ? 'DropZone-dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".csv,text/csv,text/plain"
        className="DropZone-hidden-input"
        onChange={handleChange}
      />
      <div className="DropZone-content">
        <div className="DropZone-icon-wrapper">
          <UploadCloud className="DropZone-icon" />
        </div>
        <div>
          <span className="DropZone-text-primary">
            Drag and drop CSV files here, or{' '}
            <span className="DropZone-browse-link">browse files</span>
          </span>
          <p className="DropZone-text-secondary">
            Any row/column shape • Floats, integers, negatives, scientific notation
          </p>
        </div>
      </div>
    </div>
  );
}
