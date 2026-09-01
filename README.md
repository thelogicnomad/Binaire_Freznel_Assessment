# Multi-User CSV Queueing System

A multi-user, multi-file distributed priority queueing engine and live animated dashboard built with **Node.js (Express + Socket.io + `worker_threads`)** and **React (Vite, JavaScript)**.

---

## Live Deployments

- **Frontend (Vercel)**: [https://binaire-freznel-assessment.vercel.app](https://binaire-freznel-assessment.vercel.app) *(Deploy URL placeholder)*
- **Backend (Render / Railway)**: [https://csv-queue-server.onrender.com](https://csv-queue-server.onrender.com) *(Deploy URL placeholder)*

---

## Key Features

- **Multi-User Simulation**: Persistent client ID (UUID) stored in `localStorage` per browser session. Opening multiple tabs or browsers simulates distinct users submitting jobs concurrently.
- **Multi-File & Priority Lane Scheduling**: Batch uploads with per-file priority selection (**High** vs. **Low**).
  - High-priority lane is served strictly ahead of the low-priority lane.
  - Strict **FIFO** (First-In, First-Out) arrival order is preserved within identical priority lanes.
- **All-Reduce Worker Threads**: CSV parsing and numeric summation run in a fixed-size pool of Node.js `worker_threads` (never blocking the main event loop). Supports varying shapes, floats, integers, negative numbers, thousands commas, and scientific notation while ignoring headers and text.
- **Live Real-Time Dashboards**: Complete queue state broadcast to all connected clients over **Socket.io** without polling.
- **6-Stage Lifecycle Animation**:
  1. `File uploading` (in-flight client-side upload)
  2. `File uploaded` (received by server)
  3. `File added to queue` (enqueued into high/low priority lane)
  4. `Waiting for processing` (worker assigned, worker ID displayed)
  5. `Processing…` (live streaming completion percentage and row counts)
  6. `Completed` (final summed all-reduce result displayed)
- **Targeted Result Notifications**: Direct completion events sent to the specific submitting client with celebratory UI effects.
- **Robust Failure & Timeout Recovery**: Hung or crashing workers are terminated, failed tasks are surfaced on the dashboard, and replacement workers are spawned automatically.

---

## Project Structure

```
Binaire_Freznel_Assessment/
├── package.json               # Root scripts to install and run both apps concurrently
├── .gitignore
├── README.md                  # Documentation & Concurrency/Deadlock Analysis
├── server/                    # Node.js Express + Socket.io + worker_threads
│   ├── package.json
│   ├── render.yaml            # Render deployment blueprint
│   ├── .env
│   ├── src/
│   │   ├── index.js           # Server bootstrap, CORS, and graceful shutdown
│   │   ├── config.js          # Environment configuration
│   │   ├── core/
│   │   │   ├── Task.js        # OOP Task model (status, progress, metrics, JSON serialization)
│   │   │   ├── TaskQueue.js   # OOP Priority Queue encapsulating High and Low FIFO lanes
│   │   │   ├── Scheduler.js   # Event-driven assignment loop matching tasks with workers
│   │   │   └── WorkerPool.js  # Fixed thread pool with crash & timeout recovery
│   │   ├── workers/
│   │   │   └── csvWorker.js   # Dedicated worker thread script (streaming parser & numeric reducer)
│   │   ├── services/
│   │   │   └── SocketService.js # WebSocket broadcast & direct notification layer
│   │   └── routes/
│   │       └── upload.js      # Multer multipart upload route
└── client/                    # React (Vite, JavaScript ES modules)
    ├── package.json
    ├── vite.config.js
    ├── vercel.json            # Vercel SPA routing configuration
    ├── tailwind.config.js
    ├── index.html
    ├── .env
    └── src/
        ├── main.jsx           # React DOM root
        ├── App.jsx            # Main app shell & notification banner
        ├── index.css          # Tailwind directives and custom animations
        ├── utils/
        │   └── clientId.js    # Persistent session UUID manager
        ├── hooks/
        │   └── useQueueSocket.js # Custom hook managing WebSocket live state
        └── components/
            ├── Header.jsx     # User ID badge, connection pulse, worker metrics
            ├── FileUpload.jsx # Drag-and-drop, priority selector, sample generator
            ├── StageTimeline.jsx # Animated 6-step lifecycle tracker
            ├── TaskCard.jsx   # Individual task card with status, worker ID, and final sum
            ├── QueueStats.jsx # System overview summary cards
            └── QueueDashboard.jsx # Filter tabs (All, Mine, High, Low, Completed) & search
```

---

## Concurrency and Deadlock Analysis

### 1. Which types of deadlocks are possible in this system?

In concurrent queueing and thread-pool architectures, several deadlock and pseudo-deadlock conditions are theoretically possible:

1. **Resource Starvation / Pool Exhaustion Pseudo-Deadlock (Worker Slot Depletion)**:
   - *Mechanism*: If a worker thread encounters a malformed input causing an infinite loop, catastrophic regex backtracking, or unhandled I/O hang without a timeout, that worker thread is permanently blocked.
   - *Impact*: In a fixed pool of $N$ workers (e.g. 4 threads), if 4 hanging tasks are submitted, all worker slots become permanently exhausted.
   - *System State*: While not a formal Coffman circular-wait deadlock, to the queue scheduler it is functionally indistinguishable: the scheduler waits indefinitely for a `worker:free` event that will never arrive, causing all subsequent tasks from all users to queue indefinitely.

2. **Main Event Loop Starvation (Cooperative Multitasking Deadlock)**:
   - *Mechanism*: Node.js utilizes a single-threaded event loop for handling HTTP requests, WebSocket heartbeats, and scheduler triggers. If file parsing, heavy string manipulations, or synchronous file I/O (`fs.readFileSync` on large CSVs) were executed on the main thread, the event loop would block.
   - *Impact*: When the event loop is blocked, the scheduler cannot receive messages from workers (`on('message')`), HTTP connections time out, and Socket.io ping/pong packets drop. This causes all connected clients to disconnect simultaneously.

3. **Priority Inversion / Low-Priority Lane Starvation**:
   - *Mechanism*: If high-priority jobs are continuously enqueued at a rate exceeding the worker pool's throughput, low-priority tasks in the low lane remain queued indefinitely without being dequeued.

4. **Circular-Wait Deadlocks (Coffman Condition)**:
   - *Why it is impossible at the job level*: Classic deadlocks require four conditions: *Mutual Exclusion*, *Hold and Wait*, *No Preemption*, and *Circular Wait*. Because every CSV numeric reduction is **embarrassingly parallel and fully independent** (Task $A$ never waits for the result or lock of Task $B$), cyclic dependencies cannot form between jobs.

---

### 2. How would they affect user productivity?

- **Complete System Freeze**: If worker threads hang without safety timeouts, the entire system stops processing tasks for all connected users. A single user uploading a corrupt file would bring down processing for all other users.
- **Loss of Real-Time Visibility**: When the main event loop or socket broadcast stalls, dashboards stop updating, progress bars freeze, and users cannot tell if their files are processing or failed. This leads to duplicate uploads and frustration.
- **Workflow Abandonment**: If low-priority tasks starve indefinitely during peak hours, users are forced to cancel and re-submit all tasks as "High Priority" (priority inflation), nullifying the priority system.

---

### 3. Design Mitigations Implemented in This System

1. **Per-Task Hard Timeouts (`TASK_TIMEOUT_MS`) with Auto-Recovery**:
   - `WorkerPool` sets a safety timer (default 30 seconds) on every assigned task.
   - If a worker hangs or exceeds the threshold, `worker.terminate()` is called immediately.
   - The task is transitioned to the `Failed` state with a descriptive error.
   - A clean replacement worker thread is spawned into the pool, and `worker:free` is emitted to resume processing waiting tasks.
2. **Zero CPU/IO Work on the Main Thread**:
   - All file reading, CSV tokenization, float parsing, and summation are delegated entirely to `csvWorker.js` inside dedicated `worker_threads`. The main thread only passes metadata and dispatches events.
3. **Lock-Free Single-Threaded Queue Management**:
   - By leveraging Node's single-threaded JavaScript execution for queue mutations (`TaskQueue`), state updates are naturally atomic, eliminating the risk of multi-mutex lock-ordering deadlocks.
4. **Pre-Allocation Slot Reservation (`reserve`)**:
   - Workers are reserved synchronously during the scheduler loop pass to eliminate race conditions where multiple tasks could be dispatched to the same worker slot.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18.0.0 or higher, tested on Node v22)
- npm (v9.0.0 or higher)

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or run `npm install` inside `/server` and `/client` individually).*

### 2. Configure Environment Variables
Create `.env` files in both `/server` and `/client`:

Default `/server/.env`:
```ini
PORT=5001
CLIENT_URL=http://localhost:5173
WORKER_POOL_SIZE=4
TASK_TIMEOUT_MS=30000
```

Default `/client/.env`:
```ini
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

### 3. Run Both Applications Concurrently
From the repository root:
```bash
npm run dev
```

This launches:
- **Server**: Express + Socket.io on [http://localhost:5001](http://localhost:5001)
- **Client**: React (Vite) on [http://localhost:5173](http://localhost:5173)

Open [http://localhost:5173](http://localhost:5173) in your browser. Open multiple tabs or incognito windows to simulate multiple users.

---

## Deployment Guide

### Deploying the Backend (`/server`) to Render

The backend requires a persistent Node.js process to maintain Socket.io WebSocket connections and `worker_threads`.

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect this GitHub repository (`Binaire_Freznel_Assessment`).
3. Set the following build and start settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Configure Environment Variables in Render:
   - `PORT`: `5001` (or Render's default `$PORT`)
   - `CLIENT_URL`: `https://your-frontend.vercel.app,http://localhost:5173`
   - `WORKER_POOL_SIZE`: `4`
   - `TASK_TIMEOUT_MS`: `30000`

---

### Deploying the Frontend (`/client`) to Vercel

1. Import the repository into [Vercel](https://vercel.com).
2. Set the **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variables in Vercel:
   - `VITE_API_URL`: `https://your-render-backend.onrender.com`
   - `VITE_SOCKET_URL`: `https://your-render-backend.onrender.com`
5. Deploy.
