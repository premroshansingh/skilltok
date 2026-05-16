import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Add your Render PostgreSQL database URL to the environment.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false }
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      streak_count INTEGER DEFAULT 0,
      last_login DATE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      user_handle TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      filename TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_handle TEXT NOT NULL,
      receiver_handle TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_handle TEXT NOT NULL,
      following_handle TEXT NOT NULL,
      PRIMARY KEY (follower_handle, following_handle)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      user_handle TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS likes (
      user_handle TEXT NOT NULL,
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      PRIMARY KEY (user_handle, video_id)
    )
  `);

  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT ''`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`);
  } catch (err) {
    console.error("Error altering users table:", err.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS saves (
      user_handle TEXT NOT NULL,
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      PRIMARY KEY (user_handle, video_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      user_handle TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_handle TEXT NOT NULL,
      actor_handle TEXT NOT NULL,
      type TEXT NOT NULL,
      video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT FALSE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS playlists (
      id SERIAL PRIMARY KEY,
      user_handle TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS playlist_videos (
      playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
      video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, video_id)
    )
  `);

  try {
    await pool.query(`ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_filename TEXT DEFAULT ''`);
  } catch (err) {
    console.error("Error altering videos table:", err.message);
  }
}
