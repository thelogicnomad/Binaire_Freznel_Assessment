import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskPriority } from '../core/Task.js';

export function createUploadRouter({ scheduler, uploadsDir }) {
  const router = express.Router();

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure Multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.csv';
      const uniqueName = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
      cb(null, uniqueName);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max
    },
    fileFilter: (req, file, cb) => {
      // Accept csv files or text/plain
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.csv' || file.mimetype.includes('csv') || ext === '.txt') {
        cb(null, true);
      } else {
        cb(new Error(`Only CSV files are allowed. Received: ${file.originalname}`));
      }
    },
  });

  /**
   * POST /api/upload
   * Accepts multiple CSV files and priorities.
   */
  router.post('/upload', upload.array('files', 50), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }

      const clientId = req.body.clientId || 'anonymous-client';

      // Parse priorities (can be array, JSON string, or single string)
      let priorities = [];
      if (req.body.priorities) {
        try {
          priorities = typeof req.body.priorities === 'string'
            ? JSON.parse(req.body.priorities)
            : req.body.priorities;
        } catch (e) {
          priorities = Array.isArray(req.body.priorities)
            ? req.body.priorities
            : [req.body.priorities];
        }
      }

      const createdTasks = [];

      req.files.forEach((file, index) => {
        // Look up priority by index or file originalname
        let priority = TaskPriority.LOW;
        if (Array.isArray(priorities) && priorities[index]) {
          priority = priorities[index].toLowerCase() === 'high' ? TaskPriority.HIGH : TaskPriority.LOW;
        } else if (typeof priorities === 'object' && priorities[file.originalname]) {
          priority = priorities[file.originalname].toLowerCase() === 'high' ? TaskPriority.HIGH : TaskPriority.LOW;
        } else if (req.body.priority) {
          priority = req.body.priority.toLowerCase() === 'high' ? TaskPriority.HIGH : TaskPriority.LOW;
        }

        const task = new Task({
          clientId,
          filename: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          priority,
        });

        // Add task to scheduler (automatically enqueues in priority lane)
        scheduler.addTask(task);
        createdTasks.push(task.toJSON());
      });

      return res.status(201).json({
        message: `Successfully enqueued ${createdTasks.length} file(s).`,
        tasks: createdTasks,
      });
    } catch (err) {
      console.error('Error handling upload:', err);
      return res.status(500).json({ error: err.message || 'Upload processing failed.' });
    }
  });

  /**
   * GET /api/queue
   * Returns live snapshot of the queue and workers.
   */
  router.get('/queue', (req, res) => {
    res.json(scheduler.getSnapshot());
  });

  return router;
}
