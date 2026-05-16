import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { Server } from "socket.io";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import multer from "multer";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { pool, initDb } from "./db.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);
const uploadDir = path.join(rootDir, "uploads");
const frontendDist = path.join(rootDir, "Frontend", "dist");

fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => { callback(null, true); },
    credentials: true
  }
});

const PgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 5000);

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const host = new URL(origin).hostname;
    const allowedHosts = ["localhost", "127.0.0.1"];
    if (allowedHosts.includes(host) || host.endsWith(".vercel.app") || host.endsWith(".onrender.com")) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SECRET_KEY || "super_secret_skilltok_key_for_demo",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(_req, file, callback) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, `${Date.now()}_${safeName}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ success: false, message: "Not logged in" });
  return next();
}

function dateKey(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

function dayDiff(newer, older) {
  return Math.round((Date.parse(newer) - Date.parse(older)) / 86400000);
}

app.post("/api/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password || "", user.password)) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const today = dateKey();
    const lastLogin = user.last_login ? dateKey(user.last_login) : null;
    let streak = user.streak_count || 0;
    if (!lastLogin) streak = 1;
    else if (dayDiff(today, lastLogin) === 1) streak += 1;
    else if (dayDiff(today, lastLogin) > 1) streak = 1;

    await pool.query(
      "UPDATE users SET last_login = $1, streak_count = $2 WHERE username = $3",
      [today, streak, username]
    );

    req.session.user = username;
    return res.json({ success: true, user: { name: user.name, handle: user.handle, streak } });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/signup", async (req, res, next) => {
  try {
    const { username, password, name = "New User" } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);
    await pool.query(
      "INSERT INTO users (username, password, name, handle) VALUES ($1, $2, $3, $4)",
      [username, hashedPassword, name, `@${username}`]
    );
    req.session.user = username;
    return res.json({ success: true });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }
    return next(error);
  }
});

async function createNotification(userHandle, actorHandle, type, videoId = null) {
  if (userHandle === actorHandle) return;
  await pool.query(
    "INSERT INTO notifications (user_handle, actor_handle, type, video_id) VALUES ($1, $2, $3, $4)",
    [userHandle, actorHandle, type, videoId]
  );
}

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

function moderateContent(text) {
  const banned = ["spam", "fake", "badword1", "badword2"]; 
  const lower = text.toLowerCase();
  return banned.some(word => lower.includes(word));
}

app.post("/api/upload", requireLogin, upload.single("video"), async (req, res, next) => {
  try {
    const { title, category } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "No video file provided" });
    if (moderateContent(title || "")) return res.status(400).json({ success: false, message: "Content violates standards" });

    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle || "@unknown";
    
    let videoUrl = "";
    let thumbUrl = "";

    // Upload video to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video",
        folder: "skilltok_videos"
      });
      videoUrl = uploadRes.secure_url;

      // Upload thumbnail if exists
      if (req.body.thumbnail) {
        const thumbRes = await cloudinary.uploader.upload(req.body.thumbnail, {
          folder: "skilltok_thumbnails"
        });
        thumbUrl = thumbRes.secure_url;
      }
      
      // Cleanup local temp file
      fs.unlinkSync(req.file.path);
    } else {
      // Fallback to local if no cloudinary config
      videoUrl = `/uploads/${req.file.filename}`;
      if (req.body.thumbnail) {
        const base64Data = req.body.thumbnail.replace(/^data:image\/\w+;base64,/, "");
        const thumbFilename = `thumb_${Date.now()}.jpg`;
        fs.writeFileSync(path.join(uploadDir, thumbFilename), base64Data, 'base64');
        thumbUrl = `/uploads/${thumbFilename}`;
      }
    }

    await pool.query(
      "INSERT INTO videos (user_handle, title, category, filename, thumbnail_filename) VALUES ($1, $2, $3, $4, $5)",
      [handle, req.body.title || "Untitled", req.body.category || "Uncategorized", videoUrl, thumbUrl]
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/feed", async (req, res, next) => {
  try {
    const offset = parseInt(req.query.offset || "0", 10);
    let userInterests = [];
    if (req.session.user) {
      const interestsRes = await pool.query(`
        SELECT category, COUNT(*) as weight 
        FROM videos v 
        JOIN likes l ON v.id = l.video_id 
        JOIN users u ON l.user_handle = u.handle 
        WHERE u.username = $1 
        GROUP BY category 
        ORDER BY weight DESC 
        LIMIT 3
      `, [req.session.user]);
      userInterests = interestsRes.rows.map(r => r.category);
    }

    const result = await pool.query(`
      SELECT v.*, u.name AS author_name, u.avatar_url AS author_avatar,
      (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comment_count,
      (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id) AS likes_count,
      (SELECT COALESCE(SUM(views), 0) FROM videos WHERE user_handle = u.handle) >= 500 AS is_expert
      FROM videos v
      JOIN users u ON v.user_handle = u.handle
      ORDER BY 
        CASE WHEN v.category = ANY($2::text[]) THEN 0 ELSE 1 END,
        v.timestamp DESC
      LIMIT 20 OFFSET $1
    `, [offset, userInterests]);

    let followingSet = new Set();
    let likedSet = new Set();
    let savedSet = new Set();
    if (req.session.user) {
      const userRes = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
      const handle = userRes.rows[0]?.handle;
      if (handle) {
        const followsRes = await pool.query("SELECT following_handle FROM follows WHERE follower_handle = $1", [handle]);
        followsRes.rows.forEach(r => followingSet.add(r.following_handle));
        
        const likesRes = await pool.query("SELECT video_id FROM likes WHERE user_handle = $1", [handle]);
        likesRes.rows.forEach(r => likedSet.add(r.video_id));
        
        const savesRes = await pool.query("SELECT video_id FROM saves WHERE user_handle = $1", [handle]);
        savesRes.rows.forEach(r => savedSet.add(r.video_id));
      }
    }

    return res.json({
      success: true,
      videos: result.rows.map((video) => ({
        id: video.id,
        handle: video.user_handle,
        author_name: video.author_name,
        title: video.title,
        category: video.category,
        url: video.filename,
        thumbnail_url: video.thumbnail_filename || "",
        likes: parseInt(video.likes_count, 10),
        views: video.views,
        comment_count: parseInt(video.comment_count, 10),
        is_followed: followingSet.has(video.user_handle),
        is_liked: likedSet.has(video.id),
        is_saved: savedSet.has(video.id)
      }))
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/my_videos", requireLogin, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    if (!handle) return res.json({ success: false, videos: [] });

    const videos = await pool.query(
      "SELECT * FROM videos WHERE user_handle = $1 ORDER BY timestamp DESC",
      [handle]
    );
    return res.json({
      success: true,
      videos: videos.rows.map((video) => ({
        id: video.id,
        title: video.title,
        url: video.filename,
        thumbnail_url: video.thumbnail_filename || "",
        views: video.views
      }))
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/me", requireLogin, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT name, handle, streak_count, bio, avatar_url, banner_url, points FROM users WHERE username = $1",
      [req.session.user]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ success: false, message: "Not logged in" });

    const statsResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*)::int FROM videos WHERE user_handle = $1) AS videos,
        (SELECT COALESCE(SUM(views), 0)::int FROM videos WHERE user_handle = $1) AS views,
        (SELECT COALESCE(SUM(likes), 0)::int FROM videos WHERE user_handle = $1) AS likes,
        (SELECT COUNT(*)::int FROM follows WHERE following_handle = $1) AS followers,
        (SELECT COUNT(*)::int FROM follows WHERE follower_handle = $1) AS following`,
      [user.handle]
    );
    const stats = statsResult.rows[0];
    const badges = [];
    if (stats.videos >= 1) badges.push({ icon: "fa-solid fa-camera", name: "First Upload" });
    if (stats.videos >= 5) badges.push({ icon: "fa-solid fa-medal", name: "Consistent Creator" });
    if (stats.likes >= 10) badges.push({ icon: "fa-solid fa-heart", name: "Loved Content" });
    if (stats.views >= 50) badges.push({ icon: "fa-solid fa-fire", name: "Going Viral" });
    if (stats.views >= 500) badges.push({ icon: "fa-solid fa-circle-check", name: "Verified Expert" });
    if (!badges.length) badges.push({ icon: "fa-solid fa-seedling", name: "New Learner" });

    return res.json({
      success: true,
      user: {
        name: user.name,
        handle: user.handle,
        bio: user.bio || "",
        avatar_url: user.avatar_url || "",
        banner_url: user.banner_url || "",
        points: user.points || 0,
        streak: user.streak_count || 0,
        stats,
        badges
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/profile", requireLogin, async (req, res, next) => {
  try {
    const { name, bio, avatar_url, banner_url } = req.body;
    await pool.query(
      "UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), avatar_url = COALESCE($3, avatar_url), banner_url = COALESCE($4, banner_url) WHERE username = $5",
      [name, bio, avatar_url, banner_url, req.session.user]
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/like/:videoId", requireLogin, async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    if (!handle) return res.status(401).json({ success: false });

    const existing = await pool.query("SELECT * FROM likes WHERE user_handle = $1 AND video_id = $2", [handle, videoId]);
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM likes WHERE user_handle = $1 AND video_id = $2", [handle, videoId]);
      return res.json({ success: true, liked: false });
    } else {
      await pool.query("INSERT INTO likes (user_handle, video_id) VALUES ($1, $2)", [handle, videoId]);
      
      const video = await pool.query("SELECT user_handle FROM videos WHERE id = $1", [videoId]);
      if (video.rows[0]) {
        await createNotification(video.rows[0].user_handle, handle, "like", videoId);
        await pool.query("UPDATE users SET points = points + 10 WHERE handle = $1", [video.rows[0].user_handle]);
      }

      return res.json({ success: true, liked: true });
    }
  } catch (error) {
    return next(error);
  }
});

app.post("/api/view/:videoId", async (req, res, next) => {
  try {
    const { videoId } = req.params;
    await pool.query("UPDATE videos SET views = views + 1 WHERE id = $1", [videoId]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/watch_later/:videoId", requireLogin, async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    if (!handle) return res.status(401).json({ success: false });

    const existing = await pool.query("SELECT * FROM watch_later WHERE user_handle = $1 AND video_id = $2", [handle, videoId]);
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM watch_later WHERE user_handle = $1 AND video_id = $2", [handle, videoId]);
      return res.json({ success: true, added: false });
    } else {
      await pool.query("INSERT INTO watch_later (user_handle, video_id) VALUES ($1, $2)", [handle, videoId]);
      return res.json({ success: true, added: true });
    }
  } catch (error) {
    return next(error);
  }
});

app.get("/api/watch_later", requireLogin, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    const result = await pool.query(`
      SELECT v.* FROM videos v
      JOIN watch_later w ON v.id = w.video_id
      WHERE w.user_handle = $1
      ORDER BY v.timestamp DESC
    `, [handle]);
    return res.json({ success: true, videos: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/save/:videoId", requireLogin, async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    if (!handle) return res.status(401).json({ success: false });

    const existing = await pool.query("SELECT * FROM saves WHERE user_handle = $1 AND video_id = $2", [handle, videoId]);
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM saves WHERE user_handle = $1 AND video_id = $2", [handle, videoId]);
      return res.json({ success: true, saved: false });
    } else {
      await pool.query("INSERT INTO saves (user_handle, video_id) VALUES ($1, $2)", [handle, videoId]);
      
      const video = await pool.query("SELECT user_handle FROM videos WHERE id = $1", [videoId]);
      if (video.rows[0]) {
        await createNotification(video.rows[0].user_handle, handle, "save", videoId);
        await pool.query("UPDATE users SET points = points + 5 WHERE handle = $1", [video.rows[0].user_handle]);
      }

      return res.json({ success: true, saved: true });
    }
  } catch (error) {
    return next(error);
  }
});

app.get("/api/saved_videos", requireLogin, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    if (!handle) return res.json({ success: false, videos: [] });

    const videos = await pool.query(`
      SELECT v.* 
      FROM videos v 
      JOIN saves s ON v.id = s.video_id 
      WHERE s.user_handle = $1 
      ORDER BY s.video_id DESC
    `, [handle]);
    return res.json({
      success: true,
      videos: videos.rows.map((video) => ({
        id: video.id,
        title: video.title,
        url: video.filename,
        thumbnail_url: video.thumbnail_filename || "",
        views: video.views
      }))
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/messages", requireLogin, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    if (!handle) return res.status(404).json({ success: false });

    const messages = await pool.query(`
      SELECT m.*, u.name AS other_name
      FROM messages m
      JOIN users u ON (CASE WHEN m.sender_handle = $1 THEN m.receiver_handle ELSE m.sender_handle END) = u.handle
      WHERE m.sender_handle = $1 OR m.receiver_handle = $1
      ORDER BY m.timestamp DESC
    `, [handle]);

    return res.json({ success: true, messages: messages.rows });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/messages/send", requireLogin, async (req, res, next) => {
  try {
    const { receiver_handle, content } = req.body;
    if (!receiver_handle || !content) return res.status(400).json({ success: false });

    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const senderHandle = user.rows[0]?.handle;
    const result = await pool.query(
      "INSERT INTO messages (sender_handle, receiver_handle, content) VALUES ($1, $2, $3) RETURNING *",
      [senderHandle, receiver_handle, content]
    );
    
    const newMessage = result.rows[0];
    io.to(receiver_handle).emit("new_message", newMessage);
    io.to(senderHandle).emit("new_message", newMessage);

    return res.json({ success: true, message: newMessage });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/feedback", requireLogin, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Content required" });

    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;

    await pool.query(
      "INSERT INTO feedback (user_handle, content) VALUES ($1, $2)",
      [handle, content]
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/follow", requireLogin, async (req, res, next) => {
  try {
    const { target_handle } = req.body;
    if (!target_handle) return res.status(400).json({ success: false });

    const userResult = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const myHandle = userResult.rows[0]?.handle;
    if (myHandle === target_handle) return res.status(400).json({ success: false, message: "Cannot follow yourself" });

    // Toggle follow
    const existing = await pool.query("SELECT * FROM follows WHERE follower_handle = $1 AND following_handle = $2", [myHandle, target_handle]);
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM follows WHERE follower_handle = $1 AND following_handle = $2", [myHandle, target_handle]);
      return res.json({ success: true, following: false });
    } else {
      await pool.query("INSERT INTO follows (follower_handle, following_handle) VALUES ($1, $2)", [myHandle, target_handle]);
      await createNotification(target_handle, myHandle, "follow");
      return res.json({ success: true, following: true });
    }
  } catch (error) {
    return next(error);
  }
});

app.get("/api/notifications", requireLogin, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;

    const result = await pool.query(`
      SELECT n.*, u.name AS actor_name, u.avatar_url AS actor_avatar
      FROM notifications n
      JOIN users u ON n.actor_handle = u.handle
      WHERE n.user_handle = $1
      ORDER BY n.timestamp DESC
      LIMIT 50
    `, [handle]);

    return res.json({ success: true, notifications: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/notifications/read", requireLogin, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_handle = $1", [handle]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/playlists", requireLogin, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    const result = await pool.query("SELECT * FROM playlists WHERE user_handle = $1 ORDER BY timestamp DESC", [handle]);
    return res.json({ success: true, playlists: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/playlists", requireLogin, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    await pool.query("INSERT INTO playlists (user_handle, name, description) VALUES ($1, $2, $3)", [handle, name, description]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/playlists/add", requireLogin, async (req, res, next) => {
  try {
    const { playlist_id, video_id } = req.body;
    const posRes = await pool.query("SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM playlist_videos WHERE playlist_id = $1", [playlist_id]);
    await pool.query("INSERT INTO playlist_videos (playlist_id, video_id, position) VALUES ($1, $2, $3)", [playlist_id, video_id, posRes.rows[0].next_pos]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/leaderboard", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT name, handle, avatar_url, points FROM users ORDER BY points DESC LIMIT 10");
    return res.json({ success: true, leaderboard: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/analytics", requireLogin, async (req, res, next) => {
  try {
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_videos,
        COALESCE(SUM(views), 0) as total_views,
        (SELECT COUNT(*) FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_handle = $1) as total_likes
      FROM videos WHERE user_handle = $1
    `, [handle]);

    const categoryStats = await pool.query(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(views), 0) as views
      FROM videos WHERE user_handle = $1
      GROUP BY category
    `, [handle]);

    return res.json({ success: true, summary: stats.rows[0], categories: categoryStats.rows });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/search", async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) return res.json({ success: true, users: [] });
    
    const users = await pool.query(
      "SELECT name, handle FROM users WHERE name ILIKE $1 OR handle ILIKE $1 LIMIT 10",
      [`%${query}%`]
    );
    return res.json({ success: true, users: users.rows });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/comments/:videoId", async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const result = await pool.query(`
      SELECT c.*, u.name AS author_name 
      FROM comments c 
      JOIN users u ON c.user_handle = u.handle 
      WHERE c.video_id = $1 
      ORDER BY c.timestamp DESC
    `, [videoId]);
    return res.json({ success: true, comments: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/comments/:videoId", requireLogin, async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Content required" });
    
    const user = await pool.query("SELECT handle FROM users WHERE username = $1", [req.session.user]);
    const handle = user.rows[0]?.handle;
    
    await pool.query(
      "INSERT INTO comments (video_id, user_handle, content) VALUES ($1, $2, $3)",
      [videoId, handle, content]
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.use("/uploads", express.static(uploadDir));

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ success: false, message: "Server error" });
});

await initDb();

io.on("connection", (socket) => {
  socket.on("join", (handle) => {
    if (handle) {
      socket.join(handle);
    }
  });

  socket.on("join-room", (room) => {
    socket.join(`room-${room}`);
    console.log(`User joined study room: ${room}`);
  });

  socket.on("room-message", (data) => {
    const { room, message, sender } = data;
    io.to(`room-${room}`).emit("room-message", { sender, message, timestamp: new Date() });
  });
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`SkillTok Node server running on port ${port}`);
});
