import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WorkerPool } from '../src/core/WorkerPool.js';
import { Task } from '../src/core/Task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, 'temp_test_files');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const file1Content = `Name,Age,Balance,Status,Score,Note
Alice,28,1250.50,active,95.5,Good
Bob,34,-250.25,pending,,Needs review
Charlie,45,"1,000.00",active,88.25,
Dave,invalid,500,inactive,0,`;
const file1Path = path.join(tempDir, 'mixed.csv');
fs.writeFileSync(file1Path, file1Content);
const expectedSum1 = 2791.00;

const file2Content = `10,20,30\n40,50,60`;
const file2Path = path.join(tempDir, 'no_header.csv');
fs.writeFileSync(file2Path, file2Content);
const expectedSum2 = 210;

const file3Path = path.join(tempDir, 'large.csv');
const rows = [];
rows.push('id,val1,val2,val3');
let expectedSum3 = 0;
for (let i = 1; i <= 5000; i++) {
  const v1 = i * 0.5;
  const v2 = 10;
  const v3 = -2;
  expectedSum3 += i + v1 + v2 + v3;
  rows.push(`${i},${v1},${v2},${v3}`);
}
fs.writeFileSync(file3Path, rows.join('\n'));

console.log('--- Testing WorkerPool & csvWorker ---');

const workerPool = new WorkerPool({
  size: 2,
  scriptPath: path.resolve(__dirname, '../src/workers/csvWorker.js'),
  timeoutMs: 5000,
});

async function runWorkerTest() {
  let progressCount = 0;
  workerPool.on('task:progress', () => {
    progressCount++;
  });

  const runTask = (task) => {
    return new Promise((resolve, reject) => {
      const onComplete = (data) => {
        if (data.taskId === task.id) {
          cleanup();
          resolve(data);
        }
      };
      const onError = (data) => {
        if (data.taskId === task.id) {
          cleanup();
          reject(new Error(data.error));
        }
      };
      const cleanup = () => {
        workerPool.off('task:complete', onComplete);
        workerPool.off('task:error', onError);
      };
      workerPool.on('task:complete', onComplete);
      workerPool.on('task:error', onError);

      const worker = workerPool.acquireIdleWorker();
      assert(worker, 'Should have an idle worker');
      workerPool.dispatchTask(task, worker);
    });
  };

  try {
    const task1 = new Task({
      clientId: 'test-client',
      filename: 'mixed.csv',
      filePath: file1Path,
      fileSize: fs.statSync(file1Path).size,
    });
    const res1 = await runTask(task1);
    assert.strictEqual(res1.result, expectedSum1, `Expected sum ${expectedSum1}, got ${res1.result}`);
    console.log(`✓ Test 1 Passed: Mixed shape CSV correctly summed to ${res1.result}`);

    const task2 = new Task({
      clientId: 'test-client',
      filename: 'no_header.csv',
      filePath: file2Path,
      fileSize: fs.statSync(file2Path).size,
    });
    const res2 = await runTask(task2);
    assert.strictEqual(res2.result, expectedSum2, `Expected sum ${expectedSum2}, got ${res2.result}`);
    console.log(`✓ Test 2 Passed: Headerless numeric CSV correctly summed to ${res2.result}`);

    const task3 = new Task({
      clientId: 'test-client',
      filename: 'large.csv',
      filePath: file3Path,
      fileSize: fs.statSync(file3Path).size,
    });
    const res3 = await runTask(task3);
    assert.strictEqual(res3.result, Number(expectedSum3.toFixed(4)), `Expected sum ${expectedSum3}, got ${res3.result}`);
    assert(progressCount > 0, 'Should have received progress reports during streaming');
    console.log(`✓ Test 3 Passed: 5,000-row file streamed with progress updates, sum = ${res3.result}`);

  } finally {
    await workerPool.terminateAll();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('✓ All WorkerPool and csvWorker tests passed successfully!');
}

runWorkerTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
