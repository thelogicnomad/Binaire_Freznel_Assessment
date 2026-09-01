import { parentPort } from 'worker_threads';
import fs from 'fs';
import csvParser from 'csv-parser';

if (!parentPort) {
  throw new Error('csvWorker must be run as a worker thread.');
}

/**
 * Robust numeric parser:
 * - Returns float or integer if cell is numeric
 * - Handles negative numbers, scientific notation, and thousands separators
 * - Returns null for text, headers, empty cells, and NaN
 *
 * @param {any} val
 * @returns {number|null}
 */
function parseNumericCell(val) {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  if (s === '') return null;

  // Strip currency prefixes if any
  if (s.startsWith('$') || s.startsWith('€') || s.startsWith('£')) {
    s = s.slice(1).trim();
  }

  // Standard numeric check
  const num = Number(s);
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    return num;
  }

  // Handle numbers with comma thousands-separators e.g. "1,234.56"
  if (s.includes(',')) {
    const uncomma = s.replace(/,/g, '');
    const num2 = Number(uncomma);
    if (!Number.isNaN(num2) && Number.isFinite(num2)) {
      return num2;
    }
  }

  return null;
}

/**
 * Process CSV file: streams contents, sums all numeric values, and emits progress.
 *
 * @param {Object} data
 * @param {string} data.taskId
 * @param {string} data.filePath
 * @param {number} data.fileSize
 */
async function processCsv({ taskId, filePath, fileSize }) {
  const startTime = Date.now();
  let runningSum = 0;
  let numericCount = 0;
  let rowCount = 0;
  let maxColumns = 0;
  let bytesRead = 0;
  let lastProgressReportTime = 0;
  let lastReportedPercent = -1;

  if (!fs.existsSync(filePath)) {
    parentPort.postMessage({
      type: 'error',
      taskId,
      error: `File not found at path: ${filePath}`,
    });
    return;
  }

  const effectiveFileSize = fileSize || fs.statSync(filePath).size || 1;

  const readStream = fs.createReadStream(filePath);

  readStream.on('data', (chunk) => {
    bytesRead += chunk.length;
  });

  // headers: false ensures row 1 is not discarded if the file has no header
  const parser = readStream.pipe(csvParser({ headers: false }));

  parser.on('data', (row) => {
    rowCount++;
    const values = Object.values(row);
    if (values.length > maxColumns) {
      maxColumns = values.length;
    }

    for (const val of values) {
      const num = parseNumericCell(val);
      if (num !== null) {
        runningSum += num;
        numericCount++;
      }
    }

    // Periodic progress report (throttled to every 40ms or when percentage changes by at least 1%)
    const now = Date.now();
    const rawPercent = Math.min(98, Math.round((bytesRead / effectiveFileSize) * 100));
    if (
      (rawPercent > lastReportedPercent && now - lastProgressReportTime >= 40) ||
      rawPercent >= 98
    ) {
      lastProgressReportTime = now;
      lastReportedPercent = rawPercent;
      parentPort.postMessage({
        type: 'progress',
        taskId,
        progress: rawPercent,
        rows: rowCount,
        columns: maxColumns,
        numericCount,
        runningSum: Number(runningSum.toFixed(4)),
      });
    }
  });

  parser.on('end', () => {
    const durationMs = Date.now() - startTime;

    // Final clean rounded sum (preserves decimal precision without IEEE-754 binary floating drift)
    const finalSum = Number(runningSum.toFixed(4));

    parentPort.postMessage({
      type: 'complete',
      taskId,
      result: finalSum,
      rows: rowCount,
      columns: maxColumns,
      numericCount,
      durationMs,
    });
  });

  parser.on('error', (err) => {
    parentPort.postMessage({
      type: 'error',
      taskId,
      error: `CSV Parsing error: ${err.message}`,
    });
  });

  readStream.on('error', (err) => {
    parentPort.postMessage({
      type: 'error',
      taskId,
      error: `File read error: ${err.message}`,
    });
  });
}

// Listen for job assignments from the WorkerPool
parentPort.on('message', (message) => {
  if (message && message.type === 'start') {
    processCsv(message).catch((err) => {
      parentPort.postMessage({
        type: 'error',
        taskId: message.taskId,
        error: err.message || 'Unexpected worker thread error',
      });
    });
  }
});
