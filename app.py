from flask import Flask, request, jsonify, session, redirect, url_for, send_from_directory
import os
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import time

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'super_secret_skilltok_key_for_demo'
DATABASE = 'skilltok.db'

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
            handle TEXT NOT NULL
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
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

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
        return jsonify({"success": True, "user": {"name": user['name'], "handle": user['handle']}})
    
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

@app.route('/api/upload', methods=['POST'])
def api_upload():
    if 'user' not in session: return jsonify({"success": False, "message": "Not logged in"}), 401
    
    if 'video' not in request.files:
        return jsonify({"success": False, "message": "No video file provided"}), 400
        
    file = request.files['video']
    title = request.form.get('title', 'Untitled')
    category = request.form.get('category', 'Uncategorized')
    
    if file.filename == '':
        return jsonify({"success": False, "message": "Empty filename"}), 400
        
    filename = secure_filename(str(int(time.time())) + "_" + file.filename)
    filepath = os.path.join('uploads', filename)
    file.save(filepath)
    
    conn = get_db()
    user = conn.execute('SELECT handle FROM users WHERE username = ?', (session['user'],)).fetchone()
    handle = user['handle'] if user else '@unknown'
    
    conn.execute('INSERT INTO videos (user_handle, title, category, filename) VALUES (?, ?, ?, ?)',
                 (handle, title, category, filename))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/feed', methods=['GET'])
def api_feed():
    conn = get_db()
    # Fetch latest videos
    videos = conn.execute('SELECT * FROM videos ORDER BY timestamp DESC LIMIT 20').fetchall()
    
    # Also fetch the user's name for the handle
    feed = []
    for v in videos:
        author = conn.execute('SELECT name FROM users WHERE handle = ?', (v['user_handle'],)).fetchone()
        author_name = author['name'] if author else 'User'
        
        feed.append({
            "id": v['id'],
            "handle": v['user_handle'],
            "author_name": author_name,
            "title": v['title'],
            "category": v['category'],
            "url": f"/uploads/{v['filename']}",
            "likes": v['likes'],
            "views": v['views']
        })
    conn.close()
    
    return jsonify({"success": True, "videos": feed})

@app.route('/api/my_videos', methods=['GET'])
def api_my_videos():
    if 'user' not in session: return jsonify({"success": False, "message": "Not logged in"}), 401
    
    conn = get_db()
    user = conn.execute('SELECT handle FROM users WHERE username = ?', (session['user'],)).fetchone()
    if not user:
        conn.close()
        return jsonify({"success": False, "videos": []})
        
    videos = conn.execute('SELECT * FROM videos WHERE user_handle = ? ORDER BY timestamp DESC', (user['handle'],)).fetchall()
    
    my_videos = []
    for v in videos:
        my_videos.append({
            "id": v['id'],
            "title": v['title'],
            "url": f"/uploads/{v['filename']}",
            "views": v['views']
        })
    conn.close()
    
    return jsonify({"success": True, "videos": my_videos})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory('uploads', filename)

@app.route('/api/me', methods=['GET'])
def api_me():
    if 'user' in session:
        conn = get_db()
        user = conn.execute('SELECT name, handle FROM users WHERE username = ?', (session['user'],)).fetchone()
        
        if user:
            # Calculate Gamification Stats
            stats = conn.execute('SELECT COUNT(*) as v_count, SUM(views) as v_views, SUM(likes) as v_likes FROM videos WHERE user_handle = ?', (user['handle'],)).fetchone()
            
            v_count = stats['v_count'] or 0
            v_views = stats['v_views'] or 0
            v_likes = stats['v_likes'] or 0
            
            # Determine badges based on activity
            badges = []
            if v_count >= 1:
                badges.append({"icon": "fa-solid fa-camera", "name": "First Upload"})
            if v_count >= 5:
                badges.append({"icon": "fa-solid fa-medal", "name": "Consistent Creator"})
            if v_likes >= 10:
                badges.append({"icon": "fa-solid fa-heart", "name": "Loved Content"})
            if v_views >= 50:
                badges.append({"icon": "fa-solid fa-fire", "name": "Going Viral"})
                
            # If no badges, give a newcomer badge
            if not badges:
                badges.append({"icon": "fa-solid fa-seedling", "name": "New Learner"})

            conn.close()
            
            return jsonify({
                "success": True, 
                "user": {
                    "name": user['name'], 
                    "handle": user['handle'],
                    "stats": {"videos": v_count, "views": v_views, "likes": v_likes},
                    "badges": badges
                }
            })
            
    return jsonify({"success": False, "message": "Not logged in"}), 401

if __name__ == '__main__':
    # Use environment port if available (for deployment platforms like Render/Heroku)
    port = int(os.environ.get("PORT", 5000))
    # Disable debug mode for production safety
    app.run(host='0.0.0.0', port=port, debug=False)
