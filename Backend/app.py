import os
import sqlite3
import time
from flask import Flask, request, jsonify, session, redirect, url_for, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))   # .../Backend
ROOT_DIR   = os.path.dirname(BASE_DIR)                    # .../SkillTok2.0
FRONTEND   = os.path.join(ROOT_DIR, 'Frontend')           # .../Frontend
UPLOAD_DIR = os.path.join(ROOT_DIR, 'uploads')            # .../uploads
DATABASE   = os.path.join(BASE_DIR, 'skilltok.db')

# Ensure uploads directory exists on every startup
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ─── App ──────────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=FRONTEND, static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'super_secret_skilltok_key_for_demo')

# Allow large video uploads (200 MB max)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024

# Fix session cookies for cross-origin / HTTPS deployments
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True

# ─── CORS Configuration ──────────────────────────────────────────────────────
try:
    from flask_cors import CORS
    CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:5000", "https://*.vercel.app"])
except ImportError:
    pass

# ─── Database ─────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            handle TEXT NOT NULL,
            streak_count INTEGER DEFAULT 0,
            last_login TEXT
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_handle TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            filename TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_handle TEXT NOT NULL,
            receiver_handle TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ─── Page routes ──────────────────────────────────────────────────────────────
@app.route('/')
def home():
    if 'user' in session:
        return app.send_static_file('index.html')
    return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    return app.send_static_file('login.html')

@app.route('/signup')
def signup_page():
    return app.send_static_file('signup.html')

@app.route('/discover')
def discover():
    if 'user' not in session: return redirect(url_for('login_page'))
    return app.send_static_file('discover.html')

@app.route('/profile')
def profile():
    if 'user' not in session: return redirect(url_for('login_page'))
    return app.send_static_file('profile.html')

@app.route('/upload')
def upload():
    if 'user' not in session: return redirect(url_for('login_page'))
    return app.send_static_file('upload.html')

@app.route('/inbox')
def inbox():
    if 'user' not in session: return redirect(url_for('login_page'))
    return app.send_static_file('inbox.html')

# ─── Auth API ─────────────────────────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user and check_password_hash(user['password'], password):
        session['user'] = username
        
        # Streak Logic
        from datetime import datetime, timedelta
        today = datetime.now().date()
        last_login_str = user['last_login']
        streak = user['streak_count'] or 0
        
        if last_login_str:
            last_login_date = datetime.strptime(last_login_str, '%Y-%m-%d').date()
            if last_login_date == today - timedelta(days=1):
                streak += 1
            elif last_login_date < today - timedelta(days=1):
                streak = 1
        else:
            streak = 1
            
        conn = get_db()
        conn.execute('UPDATE users SET last_login = ?, streak_count = ? WHERE username = ?', 
                     (today.strftime('%Y-%m-%d'), streak, username))
        conn.commit()
        conn.close()

        return jsonify({"success": True, "user": {"name": user['name'], "handle": user['handle'], "streak": streak}})

    return jsonify({"success": False, "message": "Invalid username or password"}), 401

@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    name = data.get('name', 'New User')

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required"}), 400

    hashed_password = generate_password_hash(password)
    handle = f"@{username}"

    try:
        conn = get_db()
        conn.execute('INSERT INTO users (username, password, name, handle) VALUES (?, ?, ?, ?)',
                     (username, hashed_password, name, handle))
        conn.commit()
        conn.close()
        session['user'] = username
        return jsonify({"success": True})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Username already exists"}), 400

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.pop('user', None)
    return jsonify({"success": True})

# ─── Upload API ───────────────────────────────────────────────────────────────
@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'user' not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401

    if 'video' not in request.files:
        return jsonify({"success": False, "message": "No video file provided"}), 400

    file = request.files['video']
    title = request.form.get('title', 'Untitled')
    category = request.form.get('category', 'Uncategorized')

    if file.filename == '':
        return jsonify({"success": False, "message": "Empty filename"}), 400

    filename = secure_filename(str(int(time.time())) + "_" + file.filename)
    filepath = os.path.join(UPLOAD_DIR, filename)   # absolute path — no crash

    try:
        file.save(filepath)
    except Exception as e:
        return jsonify({"success": False, "message": f"Could not save file: {str(e)}"}), 500

    conn = get_db()
    user = conn.execute('SELECT handle FROM users WHERE username = ?', (session['user'],)).fetchone()
    handle = user['handle'] if user else '@unknown'

    conn.execute('INSERT INTO videos (user_handle, title, category, filename) VALUES (?, ?, ?, ?)',
                 (handle, title, category, filename))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

# ─── Feed / User APIs ─────────────────────────────────────────────────────────
@app.route('/api/feed', methods=['GET'])
def api_feed():
    conn = get_db()
    # Optimized JOIN to get author name in one query (No more lag!)
    query = '''
        SELECT v.*, u.name as author_name 
        FROM videos v 
        JOIN users u ON v.user_handle = u.handle 
        ORDER BY v.timestamp DESC 
        LIMIT 20
    '''
    videos = conn.execute(query).fetchall()
    conn.close()

    feed = []
    for v in videos:
        feed.append({
            "id": v['id'],
            "handle": v['user_handle'],
            "author_name": v['author_name'],
            "title": v['title'],
            "category": v['category'],
            "url": f"/uploads/{v['filename']}",
            "likes": v['likes'],
            "views": v['views']
        })
    return jsonify({"success": True, "videos": feed})

@app.route('/api/my_videos', methods=['GET'])
def api_my_videos():
    if 'user' not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401

    conn = get_db()
    user = conn.execute('SELECT handle FROM users WHERE username = ?', (session['user'],)).fetchone()
    if not user:
        conn.close()
        return jsonify({"success": False, "videos": []})

    videos = conn.execute(
        'SELECT * FROM videos WHERE user_handle = ? ORDER BY timestamp DESC', (user['handle'],)
    ).fetchall()

    my_videos = [{"id": v['id'], "title": v['title'],
                  "url": f"/uploads/{v['filename']}", "views": v['views']} for v in videos]
    conn.close()
    return jsonify({"success": True, "videos": my_videos})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)   # absolute path

@app.route('/api/me', methods=['GET'])
def api_me():
    if 'user' in session:
        conn = get_db()
        user = conn.execute('SELECT name, handle, streak_count FROM users WHERE username = ?', (session['user'],)).fetchone()

        if user:
            stats = conn.execute(
                'SELECT COUNT(*) as v_count, SUM(views) as v_views, SUM(likes) as v_likes '
                'FROM videos WHERE user_handle = ?', (user['handle'],)
            ).fetchone()

            v_count = stats['v_count'] or 0
            v_views = stats['v_views'] or 0
            v_likes = stats['v_likes'] or 0

            badges = []
            if v_count >= 1: badges.append({"icon": "fa-solid fa-camera",  "name": "First Upload"})
            if v_count >= 5: badges.append({"icon": "fa-solid fa-medal",   "name": "Consistent Creator"})
            if v_likes >= 10: badges.append({"icon": "fa-solid fa-heart",  "name": "Loved Content"})
            if v_views >= 50: badges.append({"icon": "fa-solid fa-fire",   "name": "Going Viral"})
            if not badges:   badges.append({"icon": "fa-solid fa-seedling","name": "New Learner"})

            conn.close()
            return jsonify({
                "success": True,
                "user": {
                    "name": user['name'],
                    "handle": user['handle'],
                    "streak": user['streak_count'] or 0,
                    "stats": {"videos": v_count, "views": v_views, "likes": v_likes},
                    "badges": badges
                }
            })

    return jsonify({"success": False, "message": "Not logged in"}), 401

# ─── Chat APIs ──────────────────────────────────────────────────────────────
@app.route('/api/messages', methods=['GET'])
def get_messages():
    if 'user' not in session: return jsonify({"success": False}), 401
    
    conn = get_db()
    me = conn.execute('SELECT handle FROM users WHERE username = ?', (session['user'],)).fetchone()
    if not me: return jsonify({"success": False}), 404
    
    # Simple logic: get all messages where I am sender or receiver
    messages = conn.execute('''
        SELECT m.*, u.name as other_name 
        FROM messages m
        JOIN users u ON (CASE WHEN m.sender_handle = ? THEN m.receiver_handle ELSE m.sender_handle END) = u.handle
        WHERE m.sender_handle = ? OR m.receiver_handle = ?
        ORDER BY m.timestamp DESC
    ''', (me['handle'], me['handle'], me['handle'])).fetchall()
    conn.close()
    
    return jsonify({
        "success": True, 
        "messages": [dict(m) for m in messages]
    })

@app.route('/api/messages/send', methods=['POST'])
def send_message():
    if 'user' not in session: return jsonify({"success": False}), 401
    data = request.json
    receiver = data.get('receiver_handle')
    content = data.get('content')
    
    if not receiver or not content: return jsonify({"success": False}), 400
    
    conn = get_db()
    me = conn.execute('SELECT handle FROM users WHERE username = ?', (session['user'],)).fetchone()
    
    conn.execute('INSERT INTO messages (sender_handle, receiver_handle, content) VALUES (?, ?, ?)',
                 (me['handle'], receiver, content))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
