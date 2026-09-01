import assert from 'assert';
import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO } from 'socket.io-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TaskQueue } from '../src/core/TaskQueue.js';
import { WorkerPool } from '../src/core/WorkerPool.js';
import { Scheduler } from '../src/core/Scheduler.js';
import { SocketService } from '../src/services/SocketService.js';
import { createUploadRouter } from '../src/routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 5099;
const uploadsDir = path.join(__dirname, 'e2e_uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log('--- Running End-to-End API and Socket Integration Test ---');

// 1. Setup Server
const app = express();
const httpServer = http.createServer(app);
const ioServer = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
});

const taskQueue = new TaskQueue();
const workerPool = new WorkerPool({
  size: 2,
  scriptPath: path.resolve(__dirname, '../src/workers/csvWorker.js'),
  timeoutMs: 10000,
});
const socketService = new SocketService(ioServer);
const scheduler = new Scheduler({ taskQueue, workerPool, socketService });
socketService.setScheduler(scheduler);

app.use('/api', createUploadRouter({ scheduler, uploadsDir }));

// 2. Start server and run client interactions
async function runE2E() {
  await new Promise((resolve) => httpServer.listen(TEST_PORT, '127.0.0.1', resolve));
  console.log(`✓ Test server listening on http://127.0.0.1:${TEST_PORT}`);

  const clientId = 'e2e-test-client-123';
  const socketClient = ClientIO(`http://127.0.0.1:${TEST_PORT}`, {
    query: { clientId },
    transports: ['polling', 'websocket'],
  });

  const stagesObserved = new Set();
  const completedEvents = [];

  socketClient.on('queue:update', (data) => {
    if (data && data.tasks) {
      data.tasks.forEach((t) => {
        stagesObserved.add(t.status);
      });
    }
  });

  socketClient.on('task:completed', (completed) => {
    completedEvents.push(completed);
  });

  await new Promise((resolve) => socketClient.on('connect', resolve));
  console.log('✓ Socket.io client successfully connected and registered');

  // Create test CSV files
  const file1 = path.join(uploadsDir, 'test1.csv');
  const file2 = path.join(uploadsDir, 'test2.csv');
  fs.writeFileSync(file1, 'A,B\n10,20\n30,40'); // sum = 100
  fs.writeFileSync(file2, 'X,Y\n5,15\n25,35'); // sum = 80

  // Upload files using native fetch with FormData (Node 18+)
  const formData = new FormData();
  formData.append('clientId', clientId);
  formData.append('priorities', JSON.stringify(['low', 'high']));
  
  const blob1 = new Blob([fs.readFileSync(file1)], { type: 'text/csv' });
  const blob2 = new Blob([fs.readFileSync(file2)], { type: 'text/csv' });
  formData.append('files', blob1, 'test1_low.csv');
  formData.append('files', blob2, 'test2_high.csv');

  const uploadRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(uploadRes.status, 201, 'Upload should return 201 Created');
  const uploadJson = await uploadRes.json();
  assert.strictEqual(uploadJson.tasks.length, 2, 'Should create 2 tasks');
  console.log('✓ Upload endpoint successfully received 2 files and created tasks');

  // Wait for both tasks to complete
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for tasks to complete. Completed count: ${completedEvents.length}`));
    }, 8000);

    const check = setInterval(() => {
      if (completedEvents.length === 2) {
        clearTimeout(timeout);
        clearInterval(check);
        resolve();
      }
    }, 100);
  });

  console.log(`✓ Both tasks completed. Results: ${JSON.stringify(completedEvents)}`);

  // Verify sums
  const sumValues = completedEvents.map((c) => c.result);
  assert(sumValues.includes(100), 'Result should include 100');
  assert(sumValues.includes(80), 'Result should include 80');

  // Verify observed lifecycle stages
  console.log('Stages observed during execution:', Array.from(stagesObserved));
  assert(stagesObserved.has('File added to queue') || stagesObserved.has('Waiting for processing'));
  assert(stagesObserved.has('Completed'));

  // Clean up
  socketClient.disconnect();
  await workerPool.terminateAll();
  await new Promise((resolve) => httpServer.close(resolve));
  fs.rmSync(uploadsDir, { recursive: true, force: true });

  console.log('✅ End-to-End API and WebSocket verification passed completely!');
}

runE2E().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
