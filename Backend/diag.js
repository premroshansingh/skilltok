// Quick diagnostic for failing endpoints
import { pool } from "./db.js";

const tests = [
  {
    name: "api/me stats (multi-subquery SELECT)",
    sql: `SELECT 
      (SELECT COUNT(*) FROM videos WHERE user_handle = $1) AS videos,
      (SELECT COALESCE(SUM(views), 0) FROM videos WHERE user_handle = $1) AS views,
      (SELECT COUNT(*) FROM follows WHERE following_handle = $1) AS followers,
      (SELECT COUNT(*) FROM follows WHERE follower_handle = $1) AS following`,
    params: ["@test"]
  },
  {
    name: "api/search ILIKE",
    sql: `SELECT name, handle FROM users WHERE name ILIKE $1 OR handle ILIKE $1 LIMIT 5`,
    params: ["%test%"]
  },
  {
    name: "api/analytics count subquery",
    sql: `SELECT COUNT(*) as total_videos, COALESCE(SUM(views), 0) as total_views,
      (SELECT COUNT(*) FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_handle = $1) as total_likes
      FROM videos WHERE user_handle = $1`,
    params: ["@test"]
  },
  {
    name: "api/conversations rewritten",
    sql: `SELECT u.name, u.handle, u.avatar_url, latest.content, latest.timestamp
      FROM (
        SELECT other_handle, content, timestamp
        FROM (
          SELECT sender_handle AS other_handle, content, timestamp FROM messages WHERE receiver_handle = $1
          UNION ALL
          SELECT receiver_handle AS other_handle, content, timestamp FROM messages WHERE sender_handle = $1
        ) combined
        WHERE timestamp = (
          SELECT MAX(timestamp)
          FROM (
            SELECT sender_handle AS oh, timestamp FROM messages WHERE receiver_handle = $1
            UNION ALL
            SELECT receiver_handle AS oh, timestamp FROM messages WHERE sender_handle = $1
          ) t WHERE t.oh = combined.other_handle
        )
      ) latest
      JOIN users u ON latest.other_handle = u.handle
      ORDER BY latest.timestamp DESC`,
    params: ["@test"]
  },
  {
    name: "api/messages CASE WHEN JOIN",
    sql: `SELECT m.*, u.name AS other_name
      FROM messages m
      JOIN users u ON (CASE WHEN m.sender_handle = $1 THEN m.receiver_handle ELSE m.sender_handle END) = u.handle
      WHERE m.sender_handle = $1 OR m.receiver_handle = $1
      ORDER BY m.timestamp DESC`,
    params: ["@test"]
  }
];

for (const t of tests) {
  try {
    const r = await pool.query(t.sql, t.params);
    console.log(`✅ ${t.name} — rows: ${r.rows.length}`);
  } catch (e) {
    console.log(`❌ ${t.name}`);
    console.log(`   ERROR: ${e.message}`);
  }
}
process.exit(0);
