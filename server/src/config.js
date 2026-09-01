import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // Allow multiple origins separated by commas (useful for dev and deployed origins)
  allowedOrigins: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Fixed size worker pool, defaulting to hardware threads available or at least 2
  workerPoolSize: parseInt(
    process.env.WORKER_POOL_SIZE || String(Math.max(2, os.cpus().length)),
    10
  ),
  // Timeout for hung worker detection (defaults to 30s)
  taskTimeoutMs: parseInt(process.env.TASK_TIMEOUT_MS || '30000', 10),
  // Directory paths
  uploadsDir: path.resolve(__dirname, '../uploads'),
  workerScriptPath: path.resolve(__dirname, 'workers/csvWorker.js'),
};
