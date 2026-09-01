import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================');
console.log(' RUNNING BACKEND UNIT & CONCURRENCY TEST SUITE');
console.log('================================================\n');

const tests = ['testQueue.js', 'testWorker.js', 'testTimeout.js', 'testE2E.js'];

for (const testFile of tests) {
  const filePath = path.join(__dirname, testFile);
  console.log(`Executing ${testFile}...`);
  try {
    execSync(`node ${filePath}`, { stdio: 'inherit' });
    console.log(`\n------------------------------------------------\n`);
  } catch (err) {
    console.error(`❌ Test failed in ${testFile}`);
    process.exit(1);
  }
}

console.log('✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!');
