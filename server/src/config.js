import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// default fallback port if not in env
const defaultPort = 5001;
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173';

export const config = {
  port: parseInt(process.env.PORT || defaultPort, 10),
  clientUrl: rawOrigins,
  allowedOrigins: rawOrigins.split(',').map(s => s.trim()).filter(Boolean),
  // fallback to min 2 threads if cpu count is weird
  workerPoolSize: parseInt(
    process.env.WORKER_POOL_SIZE || Math.max(2, os.cpus()?.length || 2),
    10
  ),
  taskTimeoutMs: parseInt(process.env.TASK_TIMEOUT_MS || "30000", 10),
  uploadsDir: path.resolve(__dirname, '../uploads'),
  workerScriptPath: path.resolve(__dirname, 'workers/csvWorker.js'),
};
