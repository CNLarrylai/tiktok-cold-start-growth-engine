const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'servicegrow.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err.message);
  } else {
    console.log('SQLite database opened at', DB_PATH);
  }
});

// Convert PostgreSQL $1,$2,... placeholders to SQLite ?
const fixPlaceholders = (sql) => sql.replace(/\$\d+/g, '?');

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(fixPlaceholders(sql), params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(fixPlaceholders(sql), params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(fixPlaceholders(sql), params, (err, rows) => {
      if (err) reject(err);
      else resolve({ rows });
    });
  });

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      bio_input TEXT,
      optimized_bio TEXT,
      niche_input TEXT,
      hook_data TEXT,
      hashtags TEXT,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error initializing database:', err.message);
    else console.log('SQLite database initialized.');
  });
});

module.exports = { query, get, run };
