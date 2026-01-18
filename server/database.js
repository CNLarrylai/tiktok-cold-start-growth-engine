const { Pool } = require('pg');

// If DATABASE_URL is not present, it will fallback to a local mock or fail gracefully.
// In development, you'll need to add DATABASE_URL to your .env file.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        bio_input TEXT,
        optimized_bio TEXT,
        niche_input TEXT,
        hook_data TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized.');
  } catch (err) {
    console.error('Error initializing database', err.message);
  } finally {
    client.release();
  }
}

// Auto-initialize on load
initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
  get: async (text, params) => {
    const res = await pool.query(text, params);
    return res.rows[0];
  },
  run: (text, params) => pool.query(text, params),
};
