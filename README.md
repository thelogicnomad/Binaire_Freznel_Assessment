# Multi-User CSV Queueing System

A multi-user, multi-file distributed priority queueing engine with a live animated dashboard, built on **Node.js (Express + Socket.io + `worker_threads`)** for the backend and **React (Vite, JavaScript)** for the frontend.

---

## Live deployments

- **Frontend (Vercel)**: [https://binaire-freznel-assessment-ebon.vercel.app/](https://binaire-freznel-assessment-ebon.vercel.app/)
- **Backend (Render)**: [https://binaire-freznel-assessment-j98w.onrender.com](https://binaire-freznel-assessment-j98w.onrender.com)

> The backend runs on Render's free tier, which spins down after 15 minutes without traffic. If you're opening this link cold, the first request can take 30-60 seconds to wake the server back up. That delay is expected, not a bug.

---

## Key features

- **Multi-user simulation**: each browser session gets a persistent UUID in `localStorage`, so opening a few tabs or browsers is enough to simulate different users submitting jobs at the same time.
- **Multi-file and priority-lane scheduling**: batch uploads let you set a priority, high or low, per file. High-priority jobs are always served first, and within a lane, arrival order (strict FIFO) is preserved.
- **All-reduce worker threads**: CSV parsing and summation run in a fixed pool of Node `worker_threads`, so the main event loop never blocks on them. Handles varying row shapes, floats, integers, negative numbers, thousands separators, and scientific notation, and skips headers and non-numeric text.
- **Live dashboards**: the full queue state broadcasts to every connected client over Socket.io. No polling.
- **Six-stage lifecycle animation**: `file uploading` -> `file uploaded` -> `added to queue` -> `waiting for processing` (worker ID shown) -> `processing` (live percentage and row counts) -> `completed` (final summed result).
- **Targeted notifications**: whoever submitted a job gets a direct completion event with its own celebratory UI, rather than a broadcast everyone sees.
- **Failure and timeout recovery**: workers that hang or crash get terminated, the failed task shows up on the dashboard, and a replacement worker spins up automatically.

---

## Project structure

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

## Concurrency and deadlock analysis

### 1. Which types of deadlocks are possible in this system?

**Resource starvation / pool exhaustion (worker slot depletion).** If a worker thread hits a malformed input that sends it into an infinite loop, catastrophic regex backtracking, or an I/O hang with no timeout, that thread is stuck for good. With a fixed pool of N workers (four, here), four hanging tasks are enough to exhaust every slot. It isn't a formal Coffman circular-wait deadlock, but to the scheduler it looks the same: it's waiting on a `worker:free` event that's never coming, so every task from every user just queues up indefinitely.

**Main event loop starvation (cooperative multitasking deadlock).** Node runs a single-threaded event loop for HTTP requests, WebSocket heartbeats, and the scheduler's own triggers. If CSV parsing, heavy string manipulation, or synchronous file I/O (`fs.readFileSync` on a large file) ran on that same thread, the loop would block. Once it's blocked, the scheduler stops hearing back from workers, HTTP connections start timing out, and Socket.io's ping/pong packets stop getting through, which drops every connected client at once.

**Priority inversion / low-priority lane starvation.** If high-priority jobs keep arriving faster than the worker pool can clear them, the low-priority lane just sits there untouched until the backlog eases up.

**Circular-wait deadlocks (the classic Coffman kind) can't actually happen here.** They need four conditions at once: mutual exclusion, hold-and-wait, no preemption, and circular wait. Every CSV reduction in this system is embarrassingly parallel (task A never waits on a lock or result held by task B), so there's no cycle for them to form around.

### 2. How would they affect user productivity?

- **Complete freeze**: without a timeout safety net, one worker hanging on a corrupt file stops processing for every connected user, not just the one who uploaded it.
- **Losing visibility**: when the event loop or the socket broadcast stalls, dashboards stop updating and progress bars just sit there. Users can't tell if their file is still processing or silently dead, which tends to produce duplicate uploads and understandable frustration.
- **Giving up on the queue**: if low-priority tasks stall out during busy periods, people start marking everything "high priority" just to get it processed, which quietly defeats the point of having a priority system at all.

### 3. Design mitigations implemented in this system

1. **Per-task hard timeouts, with auto-recovery.** `WorkerPool` sets a safety timer (30 seconds by default) on every task it hands out. If a worker doesn't finish in time, `worker.terminate()` is called immediately, the task moves to a `Failed` state with a real error message, and a fresh worker spins up to take its place and pick up whatever's next.
2. **No CPU or I/O work on the main thread.** File reading, tokenizing, float parsing, and summation all happen inside `csvWorker.js`, isolated in its own worker thread. The main thread only ever passes metadata and fires events; it never touches the actual file content.
3. **Lock-free, single-threaded queue management.** Because JavaScript's queue mutations (`TaskQueue`) run on a single thread, state updates are atomic by default. There's no multi-mutex lock ordering to get wrong, so that whole class of deadlock doesn't apply here.
4. **Pre-allocated slot reservation.** Workers are reserved synchronously during the scheduler's loop pass, so a race condition can't dispatch two tasks to the same slot.

---

## Getting started (local development)

### Prerequisites
- Node.js (v18.0.0 or higher, tested on Node v22)
- npm (v9.0.0 or higher)

### 1. Install all dependencies
From the repository root:
```bash
npm run install:all
```
*(Or run `npm install` inside `/server` and `/client` individually).*

### 2. Configure environment variables
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

### 3. Run both applications concurrently
From the repository root:
```bash
npm run dev
```

This launches:
- **Server**: Express + Socket.io on [http://localhost:5001](http://localhost:5001)
- **Client**: React (Vite) on [http://localhost:5173](http://localhost:5173)

Open [http://localhost:5173](http://localhost:5173) in your browser. Open multiple tabs or incognito windows to simulate multiple users.

---

## Deployment guide

### Deploying the backend (`/server`) to Render

The backend needs a persistent Node.js process to keep Socket.io connections and `worker_threads` alive.

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect this GitHub repository (`Binaire_Freznel_Assessment`).
3. Set the following build and start settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Configure environment variables in Render:
   - `PORT`: `5001` (or Render's default `$PORT`)
   - `CLIENT_URL`: `https://binaire-freznel-assessment-ebon.vercel.app,http://localhost:5173`
   - `WORKER_POOL_SIZE`: `4`
   - `TASK_TIMEOUT_MS`: `30000`

---

### Deploying the frontend (`/client`) to Vercel

1. Import the repository into [Vercel](https://vercel.com).
2. Set the **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Configure environment variables in Vercel:
   - `VITE_API_URL`: `https://binaire-freznel-assessment-j98w.onrender.com`
   - `VITE_SOCKET_URL`: `https://binaire-freznel-assessment-j98w.onrender.com`
5. Deploy.