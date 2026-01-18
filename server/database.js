const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    bio_input TEXT,
    optimized_bio TEXT,
    niche_input TEXT,
    hook_data TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

module.exports = db;
