import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskPriority } from '../core/Task.js';

export function createUploadRouter({ scheduler, uploadsDir }) {
  const router = express.Router();

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.csv';
      const name = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
      cb(null, name);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100mb
    },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.csv' || file.mimetype.includes('csv') || ext === '.txt') {
        cb(null, true);
      } else {
        cb(new Error(`Only CSV files are allowed. Received: ${file.originalname}`));
      }
    },
  });

  router.post('/upload', upload.array('files', 50), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }

      const cId = req.body.clientId || 'anonymous-client';

      // parse priorities JSON or array
      let priorities = [];
      if (req.body.priorities) {
        try {
          priorities = typeof req.body.priorities === 'string'
            ? JSON.parse(req.body.priorities)
            : req.body.priorities;
        } catch (e) {
          priorities = Array.isArray(req.body.priorities) ? req.body.priorities : [req.body.priorities];
        }
      }

      const newTasks = [];

      req.files.forEach((file, idx) => {
        let p = TaskPriority.LOW;
        if (Array.isArray(priorities) && priorities[idx]) {
          p = String(priorities[idx]).toLowerCase() === 'high' ? TaskPriority.HIGH : TaskPriority.LOW;
        } else if (typeof priorities === 'object' && priorities[file.originalname]) {
          p = String(priorities[file.originalname]).toLowerCase() === 'high' ? TaskPriority.HIGH : TaskPriority.LOW;
        } else if (req.body.priority) {
          p = String(req.body.priority).toLowerCase() === 'high' ? TaskPriority.HIGH : TaskPriority.LOW;
        }

        const task = new Task({
          clientId: cId,
          filename: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          priority: p,
        });

        scheduler.addTask(task);
        newTasks.push(task.toJSON());
      });

      return res.status(201).json({
        message: `Successfully enqueued ${newTasks.length} file(s).`,
        tasks: newTasks,
      });
    } catch (err) {
      console.error('Upload handler error:', err);
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }
  });

  router.delete('/tasks/:id', (req, res) => {
    try {
      const taskId = req.params.id;
      const clientId = req.query.clientId || req.body?.clientId;

      const ok = scheduler.removeTask(taskId, clientId);
      if (!ok) {
        return res.status(404).json({ error: 'Task not found or already removed.' });
      }

      return res.json({ message: 'Task removed successfully.', taskId });
    } catch (err) {
      return res.status(403).json({ error: err.message });
    }
  });

  router.post('/tasks/clear', (req, res) => {
    try {
      const { clientId, all } = req.body;
      if (!clientId) {
        return res.status(400).json({ error: 'clientId is required.' });
      }

      const isAll = all === true || all === 'true';
      const removed = scheduler.clearClientTasks(clientId, !isAll);
      return res.json({ message: `Cleared ${removed} task(s).`, count: removed });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.get('/queue', (_req, res) => {
    res.json(scheduler.getSnapshot());
  });

  return router;
}
