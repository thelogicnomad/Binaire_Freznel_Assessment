import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  Flame,
  Clock,
  Sparkles,
  Plus,
  Send,
  AlertCircle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function FileUpload({ clientId, onUploadStart, onUploadSuccess, onUploadError }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

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
      priority: 'low', // Default priority
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

  /**
   * Helper to generate sample CSVs with mixed numeric data
   */
  const generateSampleCsv = (type = 'standard') => {
    let content = '';
    let filename = '';

    if (type === 'high_priority_fast') {
      filename = `fast_sample_${Math.floor(Math.random() * 1000)}.csv`;
      content = 'Item,Quantity,UnitCost,TaxRate,Discount\n';
      for (let i = 1; i <= 25; i++) {
        content += `Item_${i},${i * 2},${(i * 14.5).toFixed(2)},0.08,-${(i * 0.5).toFixed(2)}\n`;
      }
    } else {
      filename = `large_dataset_${Math.floor(Math.random() * 1000)}.csv`;
      content = 'Index,SensorA,SensorB,Adjustment,Status,Note\n';
      for (let i = 1; i <= 8000; i++) {
        content += `${i},${(Math.random() * 500).toFixed(4)},${(Math.random() * 250).toFixed(2)},${(i % 5 === 0 ? -12.5 : 3.75)},valid,ok\n`;
      }
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const sampleFile = new File([blob], filename, { type: 'text/csv' });

    setSelectedFiles((prev) => [
      ...prev,
      {
        file: sampleFile,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: filename,
        size: sampleFile.size,
        priority: type === 'high_priority_fast' ? 'high' : 'low',
      },
    ]);
  };

  /**
   * Submit files to server
   */
  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadError(null);

    // Create optimistic tasks in stage 1: 'File uploading'
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

      // Clear staged files on success
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
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            Upload CSV Files
          </h2>
          <p className="text-xs text-slate-400">
            Multi-file upload with individual priority selection (All-reduce numeric summation)
          </p>
        </div>

        {/* Quick Sample Generators */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => generateSampleCsv('high_priority_fast')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all"
            title="Generate a 25-row sample tagged with High Priority"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            + Sample (High)
          </button>
          <button
            type="button"
            onClick={() => generateSampleCsv('large_dataset')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
            title="Generate an 8,000-row sample tagged with Low Priority"
          >
            <Plus className="w-3.5 h-3.5" />
            + 8K Rows (Low)
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFilesAdded(e.target.files);
            e.target.value = ''; // Reset input
          }}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">
              Drag & drop CSV files here, or{' '}
              <span className="text-blue-400 hover:underline">browse</span>
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports any row/column shape • Floats, integers, negatives, and scientific notation
            </p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {uploadError && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Selected Files Staging Table */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Staged Files ({selectedFiles.length})</span>
            <span>Configure Priority</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-white font-medium truncate max-w-[180px] sm:max-w-xs">
                    {item.name}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] shrink-0">
                    {(item.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Priority Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handlePriorityToggle(item.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                      item.priority === 'high'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {item.priority === 'high' ? (
                      <>
                        <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>High</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Low</span>
                      </>
                    )}
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Action Bar */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleUploadSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              {isUploading
                ? 'Uploading to Queue...'
                : `Upload & Enqueue ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
