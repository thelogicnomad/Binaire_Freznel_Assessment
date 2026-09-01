import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Custom hook managing WebSocket connection, live queue state, and task lifecycle actions.
 *
 * @param {string} clientId - Current persistent client ID
 * @returns {Object} socket state, tasks, stats, and task management actions
 */
export function useQueueSocket(clientId) {
  const [isConnected, setIsConnected] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    queuedHigh: 0,
    queuedLow: 0,
    totalQueued: 0,
    activeWorkers: 0,
    totalWorkers: 4,
    workers: [],
  });
  const [lastCompletedTask, setLastCompletedTask] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    // Determine socket endpoint
    const url = SOCKET_URL || window.location.origin;

    const socket = io(url, {
      query: { clientId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('client:register', { clientId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setIsConnected(false);
    });

    // Received initial or updated queue snapshot
    socket.on('queue:snapshot', (data) => {
      if (data && Array.isArray(data.tasks)) {
        setTasks((prevTasks) => {
          // Merge optimistic tasks that are still in-flight
          const uploadingTasks = prevTasks.filter((t) => t.status === 'File uploading');
          const serverTaskIds = new Set(data.tasks.map((t) => t.id));
          const stillUploading = uploadingTasks.filter((t) => !serverTaskIds.has(t.id));
          return [...stillUploading, ...data.tasks];
        });
      }
      if (data && data.stats) {
        setStats(data.stats);
      }
    });

    // Received broadcast queue update
    socket.on('queue:update', (data) => {
      if (data && Array.isArray(data.tasks)) {
        setTasks((prevTasks) => {
          const uploadingTasks = prevTasks.filter((t) => t.status === 'File uploading');
          const serverTaskIds = new Set(data.tasks.map((t) => t.id));
          const stillUploading = uploadingTasks.filter((t) => !serverTaskIds.has(t.id));
          return [...stillUploading, ...data.tasks];
        });
      }
      if (data && data.stats) {
        setStats(data.stats);
      }
    });

    // Incremental progress event for a specific task
    socket.on('task:progress', (taskUpdate) => {
      if (!taskUpdate || !taskUpdate.id) return;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskUpdate.id) {
            return {
              ...t,
              ...taskUpdate,
              originalName: t.originalName || taskUpdate.originalName,
            };
          }
          return t;
        })
      );
    });

    // Targeted completion event for this specific client
    socket.on('task:completed', (completedData) => {
      setLastCompletedTask(completedData);

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } catch (e) {
        // Safe fallback if canvas-confetti fails
      }
    });

    socket.on('stats:update', (newStats) => {
      if (newStats) setStats(newStats);
    });

    return () => {
      socket.disconnect();
    };
  }, [clientId]);

  /**
   * Add optimistic tasks during active HTTP file upload
   */
  const addOptimisticTasks = useCallback((optimisticList) => {
    setTasks((prev) => [...optimisticList, ...prev]);
  }, []);

  /**
   * Update or remove optimistic tasks once HTTP response arrives
   */
  const resolveOptimisticTasks = useCallback((tempIds, serverTasks) => {
    setTasks((prev) => {
      const tempIdSet = new Set(tempIds);
      const filtered = prev.filter((t) => !tempIdSet.has(t.id));
      const serverTaskIds = new Set(filtered.map((t) => t.id));
      const newTasks = serverTasks.filter((t) => !serverTaskIds.has(t.id));
      return [...newTasks, ...filtered];
    });
  }, []);

  /**
   * Remove a single task by ID (cancel if in queue or delete from dashboard)
   */
  const removeTask = useCallback(async (taskId) => {
    // Optimistically remove from local state
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (!taskId.startsWith('temp-')) {
      try {
        const endpoint = `${API_URL}/api/tasks/${taskId}?clientId=${encodeURIComponent(clientId)}`;
        await fetch(endpoint, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  }, [clientId]);

  /**
   * Clear all tasks submitted by current client (waiting, processing, completed, failed)
   */
  const clearAllTasks = useCallback(async () => {
    // Optimistically remove all tasks belonging to current client
    setTasks((prev) => prev.filter((t) => t.clientId !== clientId));

    try {
      const endpoint = `${API_URL}/api/tasks/clear`;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, all: true }),
      });
    } catch (err) {
      console.error('Failed to clear all tasks:', err);
    }
  }, [clientId]);

  return {
    isConnected,
    tasks,
    stats,
    lastCompletedTask,
    clearLastCompleted: () => setLastCompletedTask(null),
    addOptimisticTasks,
    resolveOptimisticTasks,
    removeTask,
    clearAllTasks,
  };
}
