import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Custom hook managing WebSocket connection, live queue state, task lifecycle actions, and toast notifications.
 *
 * @param {string} clientId - Current persistent client ID
 * @returns {Object} socket state, tasks, stats, activeToast, and task management actions
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
  const [activeToast, setActiveToast] = useState(null);

  const socketRef = useRef(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

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
      setActiveToast({
        id: Date.now(),
        type: 'completed',
        title: 'All-Reduce Completed',
        filename: completedData.filename,
        result: completedData.result,
        rows: completedData.rows,
        durationMs: completedData.durationMs,
      });
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
   * Remove a single task by ID and trigger deletion toast
   */
  const removeTask = useCallback(async (taskId) => {
    const target = tasksRef.current.find((t) => t.id === taskId);
    const filename = target?.originalName || 'Task';

    // Optimistically remove from local state
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // Show deletion toast
    setActiveToast({
      id: Date.now(),
      type: 'deleted',
      title: 'Task Removed',
      filename,
      message: 'Task removed from queue and deleted from server.',
    });

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
   * Clear all tasks submitted by current client and trigger clear toast
   */
  const clearAllTasks = useCallback(async () => {
    const count = tasksRef.current.filter((t) => t.clientId === clientId).length;

    // Optimistically remove all tasks belonging to current client
    setTasks((prev) => prev.filter((t) => t.clientId !== clientId));

    // Show clear all toast
    setActiveToast({
      id: Date.now(),
      type: 'cleared',
      title: 'All Tasks Cleared',
      message: `Successfully cleared ${count} task${count !== 1 ? 's' : ''} from your queue.`,
    });

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
    activeToast,
    clearToast: () => setActiveToast(null),
    addOptimisticTasks,
    resolveOptimisticTasks,
    removeTask,
    clearAllTasks,
  };
}
