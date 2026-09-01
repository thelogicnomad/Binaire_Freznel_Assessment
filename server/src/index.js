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

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

const app = express();
const httpServer = http.createServer(app);

// Dynamic CORS configuration supporting local development and deployed frontend (e.g. Vercel)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = config.allowedOrigins.some(
      (allowed) => origin === allowed || allowed === '*'
    );
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isVercelPreview = /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin);

    if (isExplicitlyAllowed || isLocalhost || isVercelPreview) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Socket.io
const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Initialize OOP Core Architecture
const taskQueue = new TaskQueue();
const workerPool = new WorkerPool({
  size: config.workerPoolSize,
  scriptPath: config.workerScriptPath,
  timeoutMs: config.taskTimeoutMs,
});
const socketService = new SocketService(io);
const scheduler = new Scheduler({
  taskQueue,
  workerPool,
  socketService,
});
socketService.setScheduler(scheduler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    workers: config.workerPoolSize,
    timestamp: new Date().toISOString(),
  });
});

// Root info
app.get('/', (req, res) => {
  res.json({
    name: 'Multi-User CSV Queueing System API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/queue',
  });
});

// Mount upload and queue API routes
app.use('/api', createUploadRouter({ scheduler, uploadsDir: config.uploadsDir }));

// Graceful shutdown handling
let isShuttingDown = false;
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);

  try {
    console.log('Terminating worker pool threads...');
    await workerPool.terminateAll();
    console.log('Worker threads terminated.');

    httpServer.close(() => {
      console.log('HTTP and WebSocket server closed.');
      process.exit(0);
    });

    // Force exit after 5s if still hanging
    setTimeout(() => {
      console.error('Forced exit after shutdown timeout.');
      process.exit(1);
    }, 5000);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
httpServer.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` CSV Queue Engine Server running on port ${config.port}`);
  console.log(` Worker Pool Size: ${config.workerPoolSize} threads`);
  console.log(` Task Timeout: ${config.taskTimeoutMs} ms`);
  console.log(` Health check: http://localhost:${config.port}/health`);
  console.log(`====================================================`);
});
