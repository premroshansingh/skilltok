import pg from "pg";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool;
let isSqlite = false;

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL not found. Falling back to local SQLite database: skilltok.db");
  const dbPath = path.join(__dirname, "skilltok.db");
  const db = new Database(dbPath);
  isSqlite = true;

  // Mock the pg Pool interface for SQLite
  pool = {
    async query(text, params = []) {
      // Expand $N → ? for SQLite. PostgreSQL allows $1 to appear multiple times (reused).
      // We track each unique $N index and map them to positional ? params.
      const expandedParams = [];
      let sqliteText = text.replace(/\$(\d+)/g, (_, n) => {
        expandedParams.push(params[parseInt(n, 10) - 1]);
        return "?";
      });

      // Strip PostgreSQL casts like ::text[] or ::int
      sqliteText = sqliteText.replace(/::[a-z0-9_[\]]+/gi, "");
      // ILIKE → LIKE (SQLite LIKE is case-insensitive for ASCII)
      sqliteText = sqliteText.replace(/ILIKE/gi, "LIKE");
      // Replace ANY(?) with (1=0) and remove the corresponding array param
      sqliteText = sqliteText.replace(/ANY\(\?\)/g, () => {
        const idx = expandedParams.findIndex(p => Array.isArray(p));
        if (idx !== -1) expandedParams.splice(idx, 1);
        return "(1=0)";
      });
      // Remove DISTINCT ON (...) — not supported in SQLite
      sqliteText = sqliteText.replace(/DISTINCT ON \([^)]+\)/gi, "DISTINCT");
      // Filter out any remaining array params
      const finalParams = expandedParams.filter(p => !Array.isArray(p));

      // Check if it's a write query with RETURNING
      const hasReturning = /RETURNING/i.test(sqliteText);
      const cleanedText = hasReturning ? sqliteText.replace(/RETURNING[\s\S]*/i, "") : sqliteText;
      const isRead = cleanedText.trim().toUpperCase().startsWith("SELECT");

      try {
        if (isRead) {
          const stmt = db.prepare(cleanedText);
          const rows = stmt.all(...finalParams);
          return { rows };
        } else {
          const stmt = db.prepare(cleanedText);
          const info = stmt.run(...finalParams);
          // If RETURNING was requested, fetch the inserted/updated row back by id
          if (hasReturning && info.lastInsertRowid) {
            const tableMatch = cleanedText.match(/INTO\s+(\w+)/i) || cleanedText.match(/UPDATE\s+(\w+)/i);
            if (tableMatch) {
              try {
                const fetchBack = db.prepare(`SELECT * FROM ${tableMatch[1]} WHERE id = ?`);
                const row = fetchBack.get(info.lastInsertRowid);
                return { rows: row ? [row] : [], rowCount: info.changes };
              } catch (_e) { /* ignore */ }
            }
          }
          return { rows: [], rowCount: info.changes, lastID: info.lastInsertRowid };
        }
      } catch (err) {
        const duplicateColumnMigration = err.message?.includes("duplicate column name") && /^ALTER TABLE /i.test(cleanedText.trim());
        if (!duplicateColumnMigration) {
          console.error("SQLite Query Error:", err.message, "\nSQL:", cleanedText.trim());
        }
        throw err;
      }
    }
  };
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false }
  });
}

export { pool };

export async function initDb() {
  if (isSqlite) {
    async function sqliteColumnExists(tableName, columnName) {
      const result = await pool.query(`PRAGMA table_info(${tableName})`);
      return result.rows.some((column) => column.name === columnName);
    }

    // SQLite-specific initialization
    const tables = [
      {
        name: "users",
        sql: `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          handle TEXT NOT NULL,
          streak_count INTEGER DEFAULT 0,
          last_login TEXT,
          bio TEXT DEFAULT '',
          avatar_url TEXT DEFAULT '',
          banner_url TEXT DEFAULT '',
          points INTEGER DEFAULT 0,
          is_admin BOOLEAN DEFAULT FALSE
        )`,
        columns: [
          { name: "streak_count", type: "INTEGER DEFAULT 0" },
          { name: "last_login", type: "TEXT" },
          { name: "bio", type: "TEXT DEFAULT ''" },
          { name: "avatar_url", type: "TEXT DEFAULT ''" },
          { name: "banner_url", type: "TEXT DEFAULT ''" },
          { name: "points", type: "INTEGER DEFAULT 0" },
          { name: "is_admin", type: "BOOLEAN DEFAULT FALSE" }
        ]
      },
      {
        name: "videos",
        sql: `CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_handle TEXT NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          filename TEXT NOT NULL,
          views INTEGER DEFAULT 0,
          thumbnail_filename TEXT DEFAULT '',
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        columns: [
          { name: "thumbnail_filename", type: "TEXT DEFAULT ''" }
        ]
      },
      {
        name: "messages",
        sql: `CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_handle TEXT NOT NULL,
          receiver_handle TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: "follows",
        sql: `CREATE TABLE IF NOT EXISTS follows (
          follower_handle TEXT NOT NULL,
          following_handle TEXT NOT NULL,
          PRIMARY KEY (follower_handle, following_handle)
        )`
      },
      {
        name: "comments",
        sql: `CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          video_id INTEGER NOT NULL,
          user_handle TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )`
      },
      {
        name: "likes",
        sql: `CREATE TABLE IF NOT EXISTS likes (
          user_handle TEXT NOT NULL,
          video_id INTEGER NOT NULL,
          PRIMARY KEY (user_handle, video_id),
          FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )`
      },
      {
        name: "saves",
        sql: `CREATE TABLE IF NOT EXISTS saves (
          user_handle TEXT NOT NULL,
          video_id INTEGER NOT NULL,
          PRIMARY KEY (user_handle, video_id),
          FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )`
      },
      {
        name: "feedback",
        sql: `CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_handle TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: "notifications",
        sql: `CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_handle TEXT NOT NULL,
          actor_handle TEXT NOT NULL,
          type TEXT NOT NULL,
          video_id INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_read BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )`
      },
      {
        name: "playlists",
        sql: `CREATE TABLE IF NOT EXISTS playlists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_handle TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: "playlist_videos",
        sql: `CREATE TABLE IF NOT EXISTS playlist_videos (
          playlist_id INTEGER,
          video_id INTEGER,
          position INTEGER NOT NULL,
          PRIMARY KEY (playlist_id, video_id),
          FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
          FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )`
      },
      {
        name: "watch_later",
        sql: `CREATE TABLE IF NOT EXISTS watch_later (
          user_handle TEXT NOT NULL,
          video_id INTEGER NOT NULL,
          PRIMARY KEY (user_handle, video_id),
          FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )`
      },
      {
        name: "verification_requests",
        sql: `CREATE TABLE IF NOT EXISTS verification_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_handle TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      }
    ];

    for (const table of tables) {
      await pool.query(table.sql);
      if (table.columns) {
        for (const col of table.columns) {
          try {
            await pool.query(`ALTER TABLE ${table.name} ADD COLUMN ${col.name} ${col.type}`);
          } catch (_err) {
            // Column already exists — fine in SQLite
          }
        }
      }
    }

    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_videos_handle ON videos(user_handle)`,
      `CREATE INDEX IF NOT EXISTS idx_likes_video ON likes(video_id)`,
      `CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_handle)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_handle)`,
      `CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle)`
    ];

    for (const sql of indexes) {
      await pool.query(sql);
    }
  } else {
    // PostgreSQL initialization — full schema with all columns from the start
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        handle TEXT NOT NULL,
        streak_count INTEGER DEFAULT 0,
        last_login DATE,
        bio TEXT DEFAULT '',
        avatar_url TEXT DEFAULT '',
        banner_url TEXT DEFAULT '',
        points INTEGER DEFAULT 0,
        is_admin BOOLEAN DEFAULT FALSE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        user_handle TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        filename TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        thumbnail_filename TEXT DEFAULT '',
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS watch_later (
        user_handle TEXT NOT NULL,
        video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        PRIMARY KEY (user_handle, video_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id SERIAL PRIMARY KEY,
        user_handle TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Safe migrations for existing deployments
    const migrations = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_filename TEXT DEFAULT ''`,
      // Remove stale likes column from videos if it exists (was never updated)
      // We intentionally do NOT add it back — likes are counted from the likes table
    ];

    for (const sql of migrations) {
      try {
        await pool.query(sql);
      } catch (err) {
        console.error("Migration warning:", err.message);
      }
    }

    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_videos_handle ON videos(user_handle)`,
      `CREATE INDEX IF NOT EXISTS idx_likes_video ON likes(video_id)`,
      `CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_handle)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_handle)`,
      `CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle)`
    ];

    for (const sql of indexes) {
      try {
        await pool.query(sql);
      } catch (err) {
        console.error("Index warning:", err.message);
      }
    }
  }
}
