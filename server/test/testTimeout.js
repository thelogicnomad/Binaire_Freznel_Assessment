import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WorkerPool } from '../src/core/WorkerPool.js';
import { Task } from '../src/core/Task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Testing WorkerPool Timeout & Crash Recovery ---');

const shortTimeoutPool = new WorkerPool({
  size: 1,
  scriptPath: path.resolve(__dirname, '../src/workers/csvWorker.js'),
  timeoutMs: 400,
});

const hangWorkerPath = path.join(__dirname, 'hangWorker.js');
fs.writeFileSync(
  hangWorkerPath,
  `import { parentPort } from 'worker_threads';
parentPort.on('message', () => {});`
);

const hangPool = new WorkerPool({
  size: 1,
  scriptPath: hangWorkerPath,
  timeoutMs: 300,
});

async function runTimeoutTest() {
  const dummyTask = new Task({
    clientId: 'hang-client',
    filename: 'hang.csv',
    filePath: '/tmp/nonexistent.csv',
  });

  const timeoutPromise = new Promise((resolve) => {
    hangPool.on('task:error', (errData) => {
      assert.strictEqual(errData.taskId, dummyTask.id);
      assert(errData.error.includes('Timeout') || errData.error.includes('timed out'));
      resolve(errData);
    });
  });

  const workerSlot = hangPool.acquireIdleWorker();
  hangPool.dispatchTask(dummyTask, workerSlot);

  const res = await timeoutPromise;
  console.log(`✓ Timeout detected properly: ${res.error}`);

  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(hangPool.hasIdleWorker(), true, 'Pool should have an idle replacement worker');
  console.log('✓ Replacement worker spawned and ready to accept new tasks');

  await hangPool.terminateAll();
  await shortTimeoutPool.terminateAll();
  fs.unlinkSync(hangWorkerPath);
}

runTimeoutTest()
  .then(() => {
    console.log('✓ Timeout recovery assertions passed!');
  })
  .catch((err) => {
    console.error('Timeout test failed:', err);
    process.exit(1);
  });
