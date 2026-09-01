import { parentPort } from 'worker_threads';
import fs from 'fs';
import csvParser from 'csv-parser';

if (!parentPort) {
  throw new Error('csvWorker must be run as a worker thread.');
}

// parses cell into number, handles commas and currency symbols
function parseNumericCell(val) {
  if (val === null || val === undefined) return null;
  let str = String(val).trim();
  if (!str) return null;

  // quick check for currency prefixes
  if (str.startsWith('$') || str.startsWith('€') || str.startsWith('£')) {
    str = str.slice(1).trim();
  }

  const num = Number(str);
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    return num;
  }

  // check if formatted with thousands comma
  if (str.indexOf(',') !== -1) {
    const clean = str.replace(/,/g, '');
    const num2 = Number(clean);
    if (!Number.isNaN(num2) && Number.isFinite(num2)) {
      return num2;
    }
  }

  return null;
}

async function processCsv({ taskId, filePath, fileSize }) {
  const t0 = Date.now();
  let totalSum = 0;
  let numCount = 0;
  let rows = 0;
  let maxCols = 0;
  let bytesRead = 0;
  let lastReport = 0;
  let lastPct = -1;

  if (!fs.existsSync(filePath)) {
    parentPort.postMessage({
      type: 'error',
      taskId,
      error: `File not found at path: ${filePath}`,
    });
    return;
  }

  const totalBytes = fileSize || fs.statSync(filePath).size || 1;
  const stream = fs.createReadStream(filePath);

  stream.on('data', (chunk) => {
    bytesRead += chunk.length;
  });

  // headers: false so headerless csvs don't lose row 1
  const parser = stream.pipe(csvParser({ headers: false }));

  parser.on('data', (row) => {
    rows++;
    const cells = Object.values(row);
    if (cells.length > maxCols) {
      maxCols = cells.length;
    }

    for (let i = 0; i < cells.length; i++) {
      const n = parseNumericCell(cells[i]);
      if (n !== null) {
        totalSum += n;
        numCount++;
      }
    }

    // throttle socket updates
    const now = Date.now();
    const pct = Math.min(98, Math.round((bytesRead / totalBytes) * 100));
    if ((pct > lastPct && now - lastReport >= 40) || pct >= 98) {
      lastReport = now;
      lastPct = pct;
      parentPort.postMessage({
        type: 'progress',
        taskId,
        progress: pct,
        rows: rows,
        columns: maxCols,
        numericCount: numCount,
        runningSum: Number(totalSum.toFixed(4)),
      });
    }
  });

  parser.on('end', () => {
    const dur = Date.now() - t0;
    // avoid IEEE-754 binary floating drift
    const finalSum = Number(totalSum.toFixed(4));

    parentPort.postMessage({
      type: 'complete',
      taskId,
      result: finalSum,
      rows: rows,
      columns: maxCols,
      numericCount: numCount,
      durationMs: dur,
    });
  });

  parser.on('error', (err) => {
    parentPort.postMessage({
      type: 'error',
      taskId,
      error: `CSV Parsing error: ${err.message}`,
    });
  });

  stream.on('error', (err) => {
    parentPort.postMessage({
      type: 'error',
      taskId,
      error: `File read error: ${err.message}`,
    });
  });
}

parentPort.on('message', (msg) => {
  if (msg?.type === 'start') {
    processCsv(msg).catch((err) => {
      parentPort.postMessage({
        type: 'error',
        taskId: msg.taskId,
        error: err.message || 'Worker thread failed',
      });
    });
  }
});
