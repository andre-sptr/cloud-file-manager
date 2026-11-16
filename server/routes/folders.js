import express from 'express';
import crypto from 'crypto';
import { allQuery, getQuery, runQuery, withTransaction } from '../database.js';
import { requireAuth, UUID_REGEX } from '../middleware/auth.js';

const router = express.Router();

const MAX_FOLDER_NAME_LENGTH = 100;
const MAX_FOLDER_DEPTH = 10;

const toIsoTimestamp = (value) => {
  if (!value) return new Date().toISOString();
  const normalized =
    typeof value === 'string' && !value.includes('T') && !value.endsWith('Z')
      ? `${value.replace(' ', 'T')}Z`
      : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const formatFolder = (folder) => ({
  id: folder.id,
  owner_id: folder.owner_id,
  parent_id: folder.parent_id || null,
  name: folder.name,
  created_at: toIsoTimestamp(folder.created_at),
});

const validateFolderName = (rawName) => {
  if (typeof rawName !== 'string') {
    return { valid: false, error: 'Folder name is required' };
  }
  const trimmed = rawName.trim();
  if (!trimmed) {
    return { valid: false, error: 'Folder name cannot be empty' };
  }
  if (trimmed.length > MAX_FOLDER_NAME_LENGTH) {
    return {
      valid: false,
      error: `Folder name must be at most ${MAX_FOLDER_NAME_LENGTH} characters`,
    };
  }
  if (trimmed === '.' || trimmed === '..' || /[/\\\x00-\x1f\x7f]/.test(trimmed)) {
    return {
      valid: false,
      error: 'Folder name cannot contain slashes or control characters',
    };
  }
  return { valid: true, value: trimmed };
};

const getFolderDepth = async (folderId, ownerId) => {
  let depth = 0;
  let currentId = folderId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId) || depth >= MAX_FOLDER_DEPTH) {
      return depth + 1;
    }
    visited.add(currentId);
    const parent = await getQuery(
      'SELECT parent_id FROM folders WHERE id = ? AND owner_id = ?',
      [currentId, ownerId]
    );
    if (!parent) break;
    depth += 1;
    currentId = parent.parent_id;
  }

  return depth;
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const folders = await allQuery(
      'SELECT id, owner_id, parent_id, name, created_at FROM folders WHERE owner_id = ? ORDER BY name COLLATE NOCASE ASC',
      [req.user.id]
    );
    res.json(folders.map(formatFolder));
  } catch (error) {
    console.error('List folders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const nameResult = validateFolderName(req.body?.name);
    if (!nameResult.valid) {
      return res.status(400).json({ error: nameResult.error });
    }

    let parentId = null;
    if (req.body?.parent_id !== undefined && req.body?.parent_id !== null && req.body?.parent_id !== '') {
      if (typeof req.body.parent_id !== 'string' || !UUID_REGEX.test(req.body.parent_id)) {
        return res.status(400).json({ error: 'Invalid parent folder ID format' });
      }
      const parentFolder = await getQuery(
        'SELECT id FROM folders WHERE id = ? AND owner_id = ?',
        [req.body.parent_id, req.user.id]
      );
      if (!parentFolder) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
      const parentDepth = await getFolderDepth(parentFolder.id, req.user.id);
      if (parentDepth >= MAX_FOLDER_DEPTH) {
        return res.status(400).json({
          error: `Maximum folder nesting depth (${MAX_FOLDER_DEPTH}) reached`,
        });
      }
      parentId = parentFolder.id;
    }

    const existing = parentId
      ? await getQuery(
          'SELECT id FROM folders WHERE owner_id = ? AND parent_id = ? AND lower(name) = lower(?)',
          [req.user.id, parentId, nameResult.value]
        )
      : await getQuery(
          'SELECT id FROM folders WHERE owner_id = ? AND parent_id IS NULL AND lower(name) = lower(?)',
          [req.user.id, nameResult.value]
        );

    if (existing) {
      return res.status(409).json({ error: 'A folder with this name already exists here' });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await runQuery(
      'INSERT INTO folders (id, owner_id, parent_id, name, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, parentId, nameResult.value, createdAt]
    );

    res.status(201).json(
      formatFolder({
        id,
        owner_id: req.user.id,
        parent_id: parentId,
        name: nameResult.value,
        created_at: createdAt,
      })
    );
  } catch (error) {
    if (error?.code === 'SQLITE_CONSTRAINT' || error?.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A folder with this name already exists here' });
    }
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    if (!UUID_REGEX.test(folderId)) {
      return res.status(400).json({ error: 'Invalid folder ID format' });
    }

    const nameResult = validateFolderName(req.body?.name);
    if (!nameResult.valid) {
      return res.status(400).json({ error: nameResult.error });
    }

    const folder = await getQuery(
      'SELECT id, owner_id, parent_id, name, created_at FROM folders WHERE id = ? AND owner_id = ?',
      [folderId, req.user.id]
    );
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const duplicate = folder.parent_id
      ? await getQuery(
          'SELECT id FROM folders WHERE owner_id = ? AND parent_id = ? AND lower(name) = lower(?) AND id != ?',
          [req.user.id, folder.parent_id, nameResult.value, folderId]
        )
      : await getQuery(
          'SELECT id FROM folders WHERE owner_id = ? AND parent_id IS NULL AND lower(name) = lower(?) AND id != ?',
          [req.user.id, nameResult.value, folderId]
        );

    if (duplicate) {
      return res.status(409).json({ error: 'A folder with this name already exists here' });
    }

    await runQuery('UPDATE folders SET name = ? WHERE id = ? AND owner_id = ?', [
      nameResult.value,
      folderId,
      req.user.id,
    ]);

    res.json(
      formatFolder({
        ...folder,
        name: nameResult.value,
      })
    );
  } catch (error) {
    if (error?.code === 'SQLITE_CONSTRAINT' || error?.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A folder with this name already exists here' });
    }
    console.error('Rename folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    if (!UUID_REGEX.test(folderId)) {
      return res.status(400).json({ error: 'Invalid folder ID format' });
    }

    const folder = await getQuery(
      'SELECT id FROM folders WHERE id = ? AND owner_id = ?',
      [folderId, req.user.id]
    );
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const deletedFolderIds = await withTransaction(async () => {
      const userFolders = await allQuery(
        'SELECT id, parent_id FROM folders WHERE owner_id = ?',
        [req.user.id]
      );

      const childrenByParent = new Map();
      for (const item of userFolders) {
        if (!item.parent_id) continue;
        const list = childrenByParent.get(item.parent_id) || [];
        list.push(item.id);
        childrenByParent.set(item.parent_id, list);
      }

      const toDelete = [];
      const queue = [folderId];
      const seen = new Set();
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || seen.has(current)) continue;
        seen.add(current);
        toDelete.push(current);
        const children = childrenByParent.get(current) || [];
        for (const childId of children) {
          queue.push(childId);
        }
      }

      const placeholders = toDelete.map(() => '?').join(', ');
      await runQuery(
        `UPDATE files SET folder_id = NULL WHERE owner_id = ? AND folder_id IN (${placeholders})`,
        [req.user.id, ...toDelete]
      );

      await runQuery(
        `DELETE FROM folders WHERE owner_id = ? AND id IN (${placeholders})`,
        [req.user.id, ...toDelete]
      );

      return toDelete;
    });

    res.json({
      message: 'Folder deleted; files moved to Root',
      deletedFolderIds,
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
