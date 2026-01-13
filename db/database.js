const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    )
  `);

  saveDatabase();
  console.log('Database initialized');
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDb() {
  return db;
}

// Batch operations
function createBatch(id) {
  db.run('INSERT INTO batches (id) VALUES (?)', [id]);
  saveDatabase();
}

function getBatch(id) {
  const result = db.exec('SELECT * FROM batches WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return { id: row[0], created_at: row[1] };
}

// Asset operations
function createAsset(id, batchId, filename, filepath) {
  db.run(
    'INSERT INTO assets (id, batch_id, filename, filepath) VALUES (?, ?, ?, ?)',
    [id, batchId, filename, filepath]
  );
  saveDatabase();
}

function getAssetsByBatch(batchId) {
  const result = db.exec(
    'SELECT id, batch_id, filename, filepath, uploaded_at, status FROM assets WHERE batch_id = ?',
    [batchId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0],
    batch_id: row[1],
    filename: row[2],
    filepath: row[3],
    uploaded_at: row[4],
    status: row[5]
  }));
}

function getAsset(id) {
  const result = db.exec(
    'SELECT id, batch_id, filename, filepath, uploaded_at, status FROM assets WHERE id = ?',
    [id]
  );
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    batch_id: row[1],
    filename: row[2],
    filepath: row[3],
    uploaded_at: row[4],
    status: row[5]
  };
}

function updateAssetStatus(id, status) {
  db.run('UPDATE assets SET status = ? WHERE id = ?', [status, id]);
  saveDatabase();
}

// Comment operations
function createComment(assetId, author, content) {
  db.run(
    'INSERT INTO comments (asset_id, author, content) VALUES (?, ?, ?)',
    [assetId, author, content]
  );
  saveDatabase();

  // Return the created comment
  const result = db.exec('SELECT last_insert_rowid()');
  const commentId = result[0].values[0][0];
  return getComment(commentId);
}

function getComment(id) {
  const result = db.exec(
    'SELECT id, asset_id, author, content, created_at FROM comments WHERE id = ?',
    [id]
  );
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    asset_id: row[1],
    author: row[2],
    content: row[3],
    created_at: row[4]
  };
}

function getCommentsByAsset(assetId) {
  const result = db.exec(
    'SELECT id, asset_id, author, content, created_at FROM comments WHERE asset_id = ? ORDER BY created_at ASC',
    [assetId]
  );
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0],
    asset_id: row[1],
    author: row[2],
    content: row[3],
    created_at: row[4]
  }));
}

module.exports = {
  initDatabase,
  getDb,
  createBatch,
  getBatch,
  createAsset,
  getAssetsByBatch,
  getAsset,
  updateAssetStatus,
  createComment,
  getCommentsByAsset
};
