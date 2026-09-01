import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import { config } from './config.js';
import { TaskQueue } from './core/TaskQueue.js';
import { WorkerPool } from './core/WorkerPool.js';
import { Scheduler } from './core/Scheduler.js';
import { SocketService } from './services/SocketService.js';
import { createUploadRouter } from './routes/upload.js';

if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: (orig, cb) => {
    if (!orig) return cb(null, true);

    const allowed = config.allowedOrigins.some(o => orig === o || o === '*');
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(orig);
    const isVercel = /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(orig);

    if (allowed || isLocal || isVercel) {
      return cb(null, true);
    }
    return cb(new Error(`Origin ${orig} blocked by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new SocketIOServer(server, {
  cors: corsOptions,
  pingInterval: 10000,
  pingTimeout: 5000,
});

const queue = new TaskQueue();
const pool = new WorkerPool({
  size: config.workerPoolSize,
  scriptPath: config.workerScriptPath,
  timeoutMs: config.taskTimeoutMs,
});
const socketSvc = new SocketService(io);
const scheduler = new Scheduler({
  taskQueue: queue,
  workerPool: pool,
  socketService: socketSvc,
});
socketSvc.setScheduler(scheduler);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    workers: config.workerPoolSize,
    time: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'CSV Queue Engine',
    status: 'online',
    version: '1.0.0',
  });
});

app.use('/api', createUploadRouter({ scheduler, uploadsDir: config.uploadsDir }));

let shuttingDown = false;
async function handleShutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${sig} received, closing...`);

  try {
    await pool.terminateAll();
    server.close(() => {
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[server] forced shutdown after timeout');
      process.exit(1);
    }, 4000);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

server.listen(config.port, () => {
  console.log(`> CSV Queue Server listening on port ${config.port} (${config.workerPoolSize} worker threads)`);
});
