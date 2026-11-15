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
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_FILES_UPLOAD = 10;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_FILE_SPECS = {
  'image/jpeg': {
    extensions: ['.jpg', '.jpeg'],
    canonicalExt: '.jpg',
    inlineSafe: true,
    contentType: 'image/jpeg',
  },
  'image/png': {
    extensions: ['.png'],
    canonicalExt: '.png',
    inlineSafe: true,
    contentType: 'image/png',
  },
  'image/gif': {
    extensions: ['.gif'],
    canonicalExt: '.gif',
    inlineSafe: true,
    contentType: 'image/gif',
  },
  'image/webp': {
    extensions: ['.webp'],
    canonicalExt: '.webp',
    inlineSafe: true,
    contentType: 'image/webp',
  },
  'application/pdf': {
    extensions: ['.pdf'],
    canonicalExt: '.pdf',
    inlineSafe: false,
    contentType: 'application/pdf',
  },
  'text/plain': {
    extensions: ['.txt'],
    canonicalExt: '.txt',
    inlineSafe: false,
    contentType: 'text/plain; charset=utf-8',
  },
  'text/csv': {
    extensions: ['.csv'],
    canonicalExt: '.csv',
    inlineSafe: false,
    contentType: 'text/csv; charset=utf-8',
  },
  'application/json': {
    extensions: ['.json'],
    canonicalExt: '.json',
    inlineSafe: false,
    contentType: 'application/json; charset=utf-8',
  },
  'application/zip': {
    extensions: ['.zip'],
    canonicalExt: '.zip',
    inlineSafe: false,
    contentType: 'application/zip',
  },
  'application/x-zip-compressed': {
    extensions: ['.zip'],
    canonicalExt: '.zip',
    inlineSafe: false,
    contentType: 'application/zip',
  },
  'audio/mpeg': {
    extensions: ['.mp3'],
    canonicalExt: '.mp3',
    inlineSafe: true,
    contentType: 'audio/mpeg',
  },
  'audio/wav': {
    extensions: ['.wav'],
    canonicalExt: '.wav',
    inlineSafe: true,
    contentType: 'audio/wav',
  },
  'video/mp4': {
    extensions: ['.mp4'],
    canonicalExt: '.mp4',
    inlineSafe: true,
    contentType: 'video/mp4',
  },
  'video/webm': {
    extensions: ['.webm'],
    canonicalExt: '.webm',
    inlineSafe: true,
    contentType: 'video/webm',
  },
};

const toIsoTimestamp = (value) => {
  if (!value) return new Date().toISOString();
  const normalized = typeof value === 'string' && !value.includes('T') && !value.endsWith('Z')
    ? `${value.replace(' ', 'T')}Z`
    : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const sanitizeDisplayName = (originalname) => {
  const baseName = path.basename(originalname || 'file');
  const cleaned = baseName.replace(/[^a-zA-Z0-9._ -]/g, '_').trim();
  const safeName = cleaned || 'file';
  return safeName.length > MAX_NAME_LENGTH ? safeName.substring(0, MAX_NAME_LENGTH) : safeName;
};

const buildContentDisposition = (type, filename) => {
  const cleaned = String(filename || 'file').replace(/[\x00-\x1f\x7f]/g, '_');
  const asciiFallback = cleaned.replace(/[^\x20-\x7e]|["\\]/g, '_');
  const encoded = encodeURIComponent(cleaned).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${type}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
};

const resolveStoredFilePath = (file) => {
  if (!file || typeof file.url !== 'string') return null;
  const relativeFromUploads = file.url.replace(/^\/+uploads\/+/, '');
  const resolvedPath = path.resolve(uploadsDir, relativeFromUploads);
  const resolvedBase = uploadsDir + path.sep;
  if (!resolvedPath.startsWith(resolvedBase)) {
    return null;
  }
  return resolvedPath;
};

const cleanupUploadedFiles = async (files) => {
  if (!Array.isArray(files) || files.length === 0) return;
  await Promise.allSettled(
    files.map(async (file) => {
      if (!file?.path) return;
      try {
        await fs.promises.unlink(file.path);
      } catch (err) {
        if (err?.code !== 'ENOENT') {
          throw err;
        }
      }
    })
  );
};

const readHeaderBytes = async (filePath, length = 64) => {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const verifyFileContent = async (filePath, mimetype) => {
  if (mimetype === 'text/plain' || mimetype === 'text/csv' || mimetype === 'application/json') {
    const buffer = await fs.promises.readFile(filePath);
    if (buffer.includes(0x00)) {
      return false;
    }
    let decoded;
    try {
      decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      return false;
    }
    if (mimetype === 'application/json') {
      try {
        JSON.parse(decoded);
      } catch {
        return false;
      }
    }
    return true;
  }

  const buf = await readHeaderBytes(filePath, 64);

  switch (mimetype) {
    case 'image/jpeg':
      return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'image/png':
      return (
        buf.length >= 8 &&
        buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      );
    case 'image/gif': {
      if (buf.length < 6) return false;
      const sig = buf.subarray(0, 6).toString('ascii');
      return sig === 'GIF87a' || sig === 'GIF89a';
    }
    case 'image/webp':
      return (
        buf.length >= 12 &&
        buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buf.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    case 'application/pdf':
      return buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-';
    case 'application/zip':
    case 'application/x-zip-compressed':
      return (
        buf.length >= 4 &&
        buf[0] === 0x50 &&
        buf[1] === 0x4b &&
        ((buf[2] === 0x03 && buf[3] === 0x04) ||
          (buf[2] === 0x05 && buf[3] === 0x06) ||
          (buf[2] === 0x07 && buf[3] === 0x08))
      );
    case 'audio/mpeg':
      return (
        buf.length >= 3 &&
        (buf.subarray(0, 3).toString('ascii') === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0))
      );
    case 'audio/wav':
      return (
        buf.length >= 12 &&
        buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buf.subarray(8, 12).toString('ascii') === 'WAVE'
      );
    case 'video/mp4':
      return buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp';
    case 'video/webm':
      return buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
    default:
      return false;
  }
};

const formatOwnerFile = (file) => ({
  id: file.id,
  owner_id: file.owner_id,
  name: file.name,
  type: file.type,
  size: file.size,
  url: `/api/files/${file.id}/content`,
  is_public: Boolean(file.is_public),
  created_at: toIsoTimestamp(file.created_at),
});

const formatSharedFile = (file) => ({
  id: file.id,
  name: file.name,
  type: file.type,
  size: file.size,
  url: `/api/files/shared/${file.id}/content`,
  is_public: true,
  created_at: toIsoTimestamp(file.created_at),
});

const sendStoredFile = async (req, res, file, { forceDownload }) => {
  const resolvedPath = resolveStoredFilePath(file);
  if (!resolvedPath) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    await fs.promises.access(resolvedPath, fs.constants.R_OK);
  } catch {
    return res.status(404).json({ error: 'File not found' });
  }

  const spec = ALLOWED_FILE_SPECS[file.type];
  const contentType = spec ? spec.contentType : 'application/octet-stream';
  const allowInline = Boolean(!forceDownload && spec?.inlineSafe);
  const disposition = buildContentDisposition(allowInline ? 'inline' : 'attachment', file.name);

  return res.sendFile(
    resolvedPath,
    {
      dotfiles: 'deny',
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Cache-Control': 'no-store',
        'Content-Disposition': disposition,
      },
    },
    (err) => {
      if (err && err.code !== 'ECONNABORTED' && !res.headersSent) {
        console.error('Send file error:', err);
        res.status(err.statusCode || 500).json({ error: 'Failed to serve file' });
      }
    }
  );
};

const fileFilter = (req, file, cb) => {
  const spec = ALLOWED_FILE_SPECS[file.mimetype];
  if (!spec) {
    const err = new Error(`File type not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_SPECS).join(', ')}`);
    err.statusCode = 400;
    return cb(err, false);
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!spec.extensions.includes(ext)) {
    const err = new Error('File extension does not match its declared MIME type');
    err.statusCode = 400;
    return cb(err, false);
  }

  return cb(null, true);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user?.id || !UUID_REGEX.test(req.user.id)) {
      const err = new Error('Invalid user context');
      err.statusCode = 401;
      return cb(err);
    }
    const userDir = path.resolve(uploadsDir, req.user.id);
    if (!userDir.startsWith(uploadsDir + path.sep)) {
      const err = new Error('Invalid upload path');
      err.statusCode = 400;
      return cb(err);
    }
    fs.promises.mkdir(userDir, { recursive: true })
      .then(() => cb(null, userDir))
      .catch((err) => cb(err));
  },
  filename: function (req, file, cb) {
    const spec = ALLOWED_FILE_SPECS[file.mimetype];
    const ext = spec ? spec.canonicalExt : '';
    const uniqueSuffix = crypto.randomUUID();
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_UPLOAD,
  },
});

const uploadMiddleware = (req, res, next) => {
  upload.array('files', MAX_FILES_UPLOAD)(req, res, async (err) => {
    if (!err) return next();

    await cleanupUploadedFiles(req.files);

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File size exceeds 15MB limit' });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: `Maximum ${MAX_FILES_UPLOAD} files per upload` });
      }
      return res.status(400).json({ error: err.message });
    }

    return res.status(err.statusCode || 400).json({ error: err.message || 'Invalid file upload' });
  });
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const files = await allQuery(
      'SELECT id, owner_id, name, type, size, is_public, created_at FROM files WHERE owner_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(files.map(formatOwnerFile));
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/shared/:id', async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    const file = await getQuery(
      'SELECT id, name, type, size, is_public, created_at FROM files WHERE id = ? AND is_public = 1',
      [req.params.id]
    );
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(formatSharedFile(file));
  } catch (error) {
    console.error('Get shared file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/shared/:id/content', async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    const file = await getQuery(
      'SELECT id, name, type, size, url, is_public FROM files WHERE id = ? AND is_public = 1',
      [req.params.id]
    );
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    return await sendStoredFile(req, res, file, { forceDownload: req.query.download === '1' });
  } catch (error) {
    console.error('Get shared file content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/content', requireAuth, async (req, res) => {
  try {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    const file = await getQuery(
      'SELECT id, owner_id, name, type, size, url FROM files WHERE id = ? AND owner_id = ?',
      [req.params.id, req.user.id]
    );
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    return await sendStoredFile(req, res, file, { forceDownload: req.query.download === '1' });
  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/share', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!UUID_REGEX.test(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    if (typeof req.body?.is_public !== 'boolean') {
      return res.status(400).json({ error: 'is_public boolean is required' });
    }

    const isPublicInt = req.body.is_public ? 1 : 0;
    const result = await runQuery(
      'UPDATE files SET is_public = ? WHERE id = ? AND owner_id = ?',
      [isPublicInt, fileId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ id: fileId, is_public: req.body.is_public });
  } catch (error) {
    console.error('Update file share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/upload', requireAuth, uploadMiddleware, async (req, res) => {
  const uploadedFiles = req.files || [];
  let inTransaction = false;

  try {
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (uploadedFiles.length > MAX_FILES_UPLOAD) {
      await cleanupUploadedFiles(uploadedFiles);
      return res.status(400).json({ error: `Maximum ${MAX_FILES_UPLOAD} files per upload` });
    }

    for (const file of uploadedFiles) {
      const validContent = await verifyFileContent(file.path, file.mimetype);
      if (!validContent) {
        await cleanupUploadedFiles(uploadedFiles);
        return res.status(400).json({ error: `Invalid or mismatched content for file "${file.originalname}"` });
      }
    }

    const savedFiles = [];
    await runQuery('BEGIN TRANSACTION');
    inTransaction = true;

    for (const file of uploadedFiles) {
      const sanitizedName = sanitizeDisplayName(file.originalname);
      const id = path.basename(file.filename, path.extname(file.filename));
      const storagePath = `/uploads/${req.user.id}/${file.filename}`;
      const utcTimestamp = new Date().toISOString();

      await runQuery(
        'INSERT INTO files (id, owner_id, name, type, size, url, is_public, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
        [id, req.user.id, sanitizedName, file.mimetype, file.size, storagePath, utcTimestamp]
      );

      savedFiles.push(
        formatOwnerFile({
          id,
          owner_id: req.user.id,
          name: sanitizedName,
          type: file.mimetype,
          size: file.size,
          is_public: 0,
          created_at: utcTimestamp,
        })
      );
    }

    await runQuery('COMMIT');
    inTransaction = false;

    res.status(201).json(savedFiles);
  } catch (error) {
    if (inTransaction) {
      await runQuery('ROLLBACK').catch(() => {});
    }
    await cleanupUploadedFiles(uploadedFiles);
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!UUID_REGEX.test(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }

    const file = await getQuery('SELECT * FROM files WHERE id = ? AND owner_id = ?', [fileId, req.user.id]);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = resolveStoredFilePath(file);
    if (filePath) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        if (err?.code === 'ENOENT') {
          console.warn(`File not found at path for file ${fileId}`);
        } else {
          throw err;
        }
      }
    } else {
      console.warn(`Invalid stored path for file ${fileId}`);
    }

    await runQuery('DELETE FROM files WHERE id = ? AND owner_id = ?', [fileId, req.user.id]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
