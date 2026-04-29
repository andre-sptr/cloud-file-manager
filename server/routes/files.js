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

const MAX_NAME_LENGTH = 255;
const MAX_FILES_UPLOAD = 10;

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'video/webm'
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userDir = path.join(uploadsDir, req.user.id);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(sanitizedName);
    const uniqueSuffix = crypto.randomUUID();
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const files = await allQuery('SELECT * FROM files WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(files);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

router.post('/upload', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (uploadedFiles.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 files per upload' });
    }

    const savedFiles = [];

    for (const file of uploadedFiles) {
      let sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (sanitizedName.length > MAX_NAME_LENGTH) {
        sanitizedName = sanitizedName.substring(0, MAX_NAME_LENGTH);
      }

      const id = path.basename(file.filename, path.extname(file.filename));
      const url = `/uploads/${req.user.id}/${file.filename}`;

      await runQuery(
        'INSERT INTO files (id, owner_id, name, type, size, url) VALUES (?, ?, ?, ?, ?, ?)',
        [id, req.user.id, sanitizedName, file.mimetype, file.size, url]
      );

      savedFiles.push({
        id,
        name: sanitizedName,
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

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    const file = await getQuery('SELECT * FROM files WHERE id = ? AND owner_id = ?', [fileId, req.user.id]);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(__dirname, '..', file.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      console.warn(`File not found at path: ${filePath}`);
    }

    await runQuery('DELETE FROM files WHERE id = ?', [fileId]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
