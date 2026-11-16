import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbFile = join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbFile);

export const initDb = async () => {
  await runQuery('PRAGMA foreign_keys = ON');
  await runQuery('PRAGMA busy_timeout = 5000');
  await runQuery('PRAGMA journal_mode = WAL');

  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      folder_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);

  const userColumns = await allQuery('PRAGMA table_info(users)');
  const hasGoogleSub = userColumns.some((col) => col.name === 'google_sub');
  if (!hasGoogleSub) {
    await runQuery('ALTER TABLE users ADD COLUMN google_sub TEXT');
  }
  const hasAuthProvider = userColumns.some((col) => col.name === 'auth_provider');
  if (!hasAuthProvider) {
    await runQuery("ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local'");
  }
  await runQuery(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL'
  );

  const columns = await allQuery('PRAGMA table_info(files)');
  const hasIsPublic = columns.some((col) => col.name === 'is_public');
  if (!hasIsPublic) {
    await runQuery('ALTER TABLE files ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0');
  }
  const hasFolderId = columns.some((col) => col.name === 'folder_id');
  if (!hasFolderId) {
    await runQuery('ALTER TABLE files ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL');
  }

  await runQuery('CREATE INDEX IF NOT EXISTS idx_folders_owner_parent ON folders(owner_id, parent_id)');
  await runQuery(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_unique_root_name ON folders(owner_id, lower(name)) WHERE parent_id IS NULL'
  );
  await runQuery(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_unique_child_name ON folders(owner_id, parent_id, lower(name)) WHERE parent_id IS NOT NULL'
  );
  await runQuery('CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id)');
  await runQuery('CREATE INDEX IF NOT EXISTS idx_files_owner_folder ON files(owner_id, folder_id)');
};

export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

let transactionQueue = Promise.resolve();

export const withTransaction = (fn) => {
  const run = transactionQueue.then(async () => {
    await runQuery('BEGIN IMMEDIATE TRANSACTION');
    try {
      const result = await fn();
      await runQuery('COMMIT');
      return result;
    } catch (err) {
      await runQuery('ROLLBACK').catch(() => {});
      throw err;
    }
  });

  // Preserve the serial queue if an earlier transaction rejected
  transactionQueue = run.catch(() => {});
  return run;
};

export default db;
