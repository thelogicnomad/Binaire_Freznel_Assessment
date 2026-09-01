import React, { useState } from 'react';
import './FileUpload.css';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { DropZone } from '../DropZone/DropZone';
import { StagedFileList } from '../StagedFileList/StagedFileList';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Greentiq file upload manager with primary pill button and staged file management
 */
export function FileUpload({ clientId, onUploadStart, onUploadSuccess, onUploadError }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFilesAdded = (files) => {
    const csvFiles = Array.from(files).filter(
      (f) => f.name.endsWith('.csv') || f.type.includes('csv') || f.name.endsWith('.txt')
    );

    if (csvFiles.length === 0) {
      setUploadError('Please select valid .csv files.');
      return;
    }

    setUploadError(null);
    const newEntries = csvFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: file.size,
      priority: 'low',
    }));

    setSelectedFiles((prev) => [...prev, ...newEntries]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handlePriorityToggle = (id) => {
    setSelectedFiles((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, priority: item.priority === 'high' ? 'low' : 'high' }
          : item
      )
    );
  };

  const handleRemoveFile = (id) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadError(null);

    const optimisticTasks = selectedFiles.map((item) => ({
      id: `temp-${item.id}`,
      clientId,
      filename: item.name,
      originalName: item.name,
      fileSize: item.size,
      priority: item.priority,
      status: 'File uploading',
      progress: 0,
      rows: 0,
      columns: 0,
      numericCount: 0,
      result: null,
      assignedWorkerId: null,
      error: null,
      createdAt: new Date().toISOString(),
    }));

    if (onUploadStart) {
      onUploadStart(optimisticTasks);
    }

    const formData = new FormData();
    formData.append('clientId', clientId);

    const priorities = selectedFiles.map((f) => f.priority);
    formData.append('priorities', JSON.stringify(priorities));

    selectedFiles.forEach((item) => {
      formData.append('files', item.file);
    });

    try {
      const endpoint = `${API_URL}/api/upload`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      setSelectedFiles([]);

      if (onUploadSuccess) {
        const tempIds = optimisticTasks.map((t) => t.id);
        onUploadSuccess(tempIds, result.tasks);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to connect to upload server.');
      if (onUploadError) {
        onUploadError(optimisticTasks.map((t) => t.id), err);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="FileUpload-card">
      <div className="FileUpload-header">
        <div className="FileUpload-title-group">
          <h2 className="FileUpload-title">
            Upload CSV Files
          </h2>
          <p className="FileUpload-subtitle">
            Tag files with High or Low priority for parallel worker thread reduction
          </p>
        </div>
      </div>

      <DropZone
        onFilesAdded={handleFilesAdded}
        isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      {uploadError && (
        <div className="FileUpload-error-box">
          <AlertCircle className="FileUpload-error-icon" />
          <span>{uploadError}</span>
        </div>
      )}

      <StagedFileList
        files={selectedFiles}
        onTogglePriority={handlePriorityToggle}
        onRemoveFile={handleRemoveFile}
      />

      {selectedFiles.length > 0 && (
        <div className="FileUpload-submit-wrapper">
          <button
            type="button"
            disabled={isUploading}
            onClick={handleUploadSubmit}
            className="FileUpload-btn-primary"
          >
            <span>
              {isUploading
                ? 'Uploading to Queue...'
                : `Upload & Enqueue ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </span>
            <ArrowRight className="FileUpload-btn-icon" />
          </button>
        </div>
      )}
    </div>
  );
}
