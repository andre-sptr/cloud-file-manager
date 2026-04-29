import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { runQuery, allQuery, getQuery } from '../database.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userDir = path.join(uploadsDir, req.user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// List files for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const files = await allQuery('SELECT * FROM files WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(files);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shared file metadata (public)
router.get('/shared/:id', async (req, res) => {
  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ?', [req.params.id]);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    console.error('Get shared file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload file(s)
router.post('/upload', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const savedFiles = [];
    
    for (const file of uploadedFiles) {
      const id = crypto.randomUUID();
      // Calculate relative URL to be served by static middleware
      const url = `/uploads/${req.user.id}/${file.filename}`;
      
      await runQuery(
        'INSERT INTO files (id, owner_id, name, type, size, url) VALUES (?, ?, ?, ?, ?, ?)',
        [id, req.user.id, file.originalname, file.mimetype, file.size, url]
      );
      
      savedFiles.push({
        id,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url,
        owner_id: req.user.id
      });
    }

    res.status(201).json(savedFiles);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a file
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Check if file exists and belongs to user
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND owner_id = ?', [fileId, req.user.id]);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from filesystem
    const filePath = path.join(__dirname, '..', file.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await runQuery('DELETE FROM files WHERE id = ?', [fileId]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
