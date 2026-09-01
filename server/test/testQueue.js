import assert from 'assert';
import { Task, TaskPriority, TaskStatus } from '../src/core/Task.js';
import { TaskQueue } from '../src/core/TaskQueue.js';

console.log('--- Testing TaskQueue & Priority Ordering ---');

const queue = new TaskQueue();

assert.strictEqual(queue.size(), 0);
assert.strictEqual(queue.isEmpty(), true);
assert.strictEqual(queue.dequeue(), null);

const low1 = new Task({ clientId: 'c1', filename: 'low1.csv', priority: TaskPriority.LOW });
const low2 = new Task({ clientId: 'c2', filename: 'low2.csv', priority: TaskPriority.LOW });
const high1 = new Task({ clientId: 'c3', filename: 'high1.csv', priority: TaskPriority.HIGH });
const low3 = new Task({ clientId: 'c4', filename: 'low3.csv', priority: TaskPriority.LOW });
const high2 = new Task({ clientId: 'c5', filename: 'high2.csv', priority: TaskPriority.HIGH });

queue.enqueue(low1);
queue.enqueue(low2);
queue.enqueue(high1);
queue.enqueue(low3);
queue.enqueue(high2);

assert.strictEqual(queue.size(), 5);
const laneSizes = queue.getLaneSizes();
assert.strictEqual(laneSizes.high, 2);
assert.strictEqual(laneSizes.low, 3);

assert.strictEqual(low1.status, TaskStatus.ADDED_TO_QUEUE);
assert.strictEqual(high1.status, TaskStatus.ADDED_TO_QUEUE);

const removed = queue.remove(low2.id);
assert.strictEqual(removed, true, 'Expected low2 to be removed from queue');
assert.strictEqual(queue.size(), 4);

const d1 = queue.dequeue();
assert.strictEqual(d1.id, high1.id, 'Expected high1 first');

const d2 = queue.dequeue();
assert.strictEqual(d2.id, high2.id, 'Expected high2 second');

const d3 = queue.dequeue();
assert.strictEqual(d3.id, low1.id, 'Expected low1 third');

const d4 = queue.dequeue();
assert.strictEqual(d4.id, low3.id, 'Expected low3 fourth');

assert.strictEqual(queue.dequeue(), null, 'Expected null when empty');
assert.strictEqual(queue.isEmpty(), true);

console.log('✓ TaskQueue: High priority served before low priority');
console.log('✓ TaskQueue: FIFO preserved within identical priority lanes');
console.log('✓ TaskQueue: Task removal from lane verified');
console.log('✓ TaskQueue: All assertions passed!');
