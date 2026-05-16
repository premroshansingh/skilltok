import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

function LogoIcon() {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #00f2fe, #ff0844)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,242,254,0.4)", flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C9.5 3 8 5 8 7C6.5 7 5 8.5 5 10.5C5 12.5 6.5 14 8 14H9V16H7C5.3 16 4 17.3 4 19V21H20V19C20 17.3 18.7 16 17 16H15V14H16C17.5 14 19 12.5 19 10.5C19 8.5 17.5 7 16 7C16 5 14.5 3 12 3Z" fill="white" opacity="0.9"/>
        <polygon points="10,9 10,15 16,12" fill="white"/>
      </svg>
    </div>
  );
}

const navItems = [
  ["/", "home", "fa-solid fa-house", "Home"],
  ["/discover", "discover", "fa-solid fa-compass", "Discover"],
  ["/upload", "upload", "fa-solid fa-plus", ""],
  ["/inbox", "inbox", "fa-solid fa-message", "Inbox"],
  ["/profile", "profile", "fa-solid fa-user", "Profile"]
];

const learningCategories = ["For You", "Motivation", "Courses", "Kids Special", "Youth", "Farming", "World", "Tech", "Business"];

function api(path, options = {}) {
  const baseUrl = window.CONFIG?.API_URL || "";
  return fetch(baseUrl + path, { credentials: "include", ...options });
}

let socket;
function getSocket() {
  if (!socket) {
    const baseUrl = window.CONFIG?.API_URL || "";
    socket = io(baseUrl || window.location.origin, { withCredentials: true });
    const handle = localStorage.getItem("userHandle");
    if (handle) socket.emit("join", handle);
  }
  return socket;
}

function go(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return path;
}

function BottomNav({ active }) {
  return (
    <nav className="bottom-nav">
      {navItems.map(([href, key, icon, label]) => (
        <a key={key} href={href} className={`nav-item ${active === key ? "active" : ""} ${key === "upload" ? "upload-btn" : ""}`} onClick={(event) => {
          event.preventDefault();
          go(href);
        }}>
          {key === "upload" ? <div className="upload-icon-wrapper"><i className={icon}></i></div> : <><i className={icon}></i><span>{label}</span></>}
        </a>
      ))}
    </nav>
  );
}

function Shell({ title, active, children, right, back }) {
  return (
    <div className="app-container">
      <header className="page-header split">
        {back ? <button className="icon-btn" onClick={() => go("/")}><i className="fa-solid fa-arrow-left"></i></button> : <span className="spacer"></span>}
        <h1>{title}</h1>
        {right || <span className="spacer"></span>}
      </header>
      <main className="content-area">{children}</main>
      <BottomNav active={active} />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="form-group">
      <span>{label}</span>
      <input className="form-control" type={type} value={value} required placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AuthShell({ children }) {
  return (
    <div className="app-container auth-bg">
      <div className="auth-overlay"></div>
      <main className="login-container">
        <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <LogoIcon />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2rem", fontWeight: 700, background: "linear-gradient(135deg, #00f2fe, #4facfe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SkillTok</span>
        </div>
        {children}
      </main>
    </div>
  );
}

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const response = await api("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!data.success) return setError(data.message || "Invalid credentials");
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userHandle", data.user.handle);
    go("/");
  }

  return (
    <AuthShell>
      <section className="login-box">
        <h2>Welcome Back</h2>
        <p>Log in to continue learning</p>
        <form onSubmit={submit}>
          <Field label="Username" value={form.username} placeholder="Enter username" onChange={(username) => setForm({ ...form, username })} />
          <Field label="Password" type="password" value={form.password} placeholder="Enter password" onChange={(password) => setForm({ ...form, password })} />
          {error && <div className="error-msg">{error}</div>}
          <button className="btn-primary">Log In</button>
        </form>
        <div className="auth-link">Don't have an account? <a href="/signup" onClick={(event) => { event.preventDefault(); go("/signup"); }}>Sign Up</a></div>
      </section>
    </AuthShell>
  );
}

function Signup() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", username: "", password: "", categories: [] });
  const picks = ["Coding", "Business", "Motivation", "SoftSkills", "Courses", "Kids", "Youth", "Farming", "DIY", "World"];

  async function submit() {
    const response = await api("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!data.success) return setError(data.message || "Registration failed");
    localStorage.setItem("userName", form.name);
    localStorage.setItem("userHandle", `@${form.username}`);
    go("/");
  }

  return (
    <AuthShell>
      <section className="login-box">
        <h2>Create Account</h2>
        <p>Join the community and start learning</p>
        {step === 1 ? (
          <form onSubmit={(event) => { event.preventDefault(); setStep(2); }}>
            <Field label="Full Name" value={form.name} placeholder="e.g. John Doe" onChange={(name) => setForm({ ...form, name })} />
            <Field label="Choose Username" value={form.username} placeholder="e.g. johndoe123" onChange={(username) => setForm({ ...form, username })} />
            <Field label="Password" type="password" value={form.password} placeholder="Create password" onChange={(password) => setForm({ ...form, password })} />
            <button className="btn-primary">Next Step <i className="fa-solid fa-arrow-right"></i></button>
          </form>
        ) : (
          <>
            <div className="signup-preview">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=4FACFE&color=fff&size=150`} alt="" />
              <h3>{form.name}</h3>
              <p>Select the skills you want to learn</p>
            </div>
            <div className="categories-grid">
              {picks.map((item) => (
                <label key={item}><input type="checkbox" checked={form.categories.includes(item)} onChange={(event) => {
                  setForm({ ...form, categories: event.target.checked ? [...form.categories, item] : form.categories.filter((category) => category !== item) });
                }} /> {item}</label>
              ))}
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" onClick={submit}>Finish Sign Up</button>
            <button className="ghost-btn" onClick={() => setStep(1)}>Go Back</button>
          </>
        )}
        <div className="auth-link">Already have an account? <a href="/login" onClick={(event) => { event.preventDefault(); go("/login"); }}>Log In</a></div>
      </section>
    </AuthShell>
  );
}

function Home() {
  const [videos, setVideos] = useState([]);
  const [activeCategory, setActiveCategory] = useState("For You");
  const [liked, setLiked] = useState({});
  const [followed, setFollowed] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [commentsModal, setCommentsModal] = useState(null);
  const [commentsData, setCommentsData] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [doubleTapHeart, setDoubleTapHeart] = useState(null);
  const [saved, setSaved] = useState({});
  const viewedVideosRef = useRef(new Set());

  const loadFeed = (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    api(`/api/feed?offset=${currentOffset}`).then((res) => res.json()).then((data) => {
      if (data.success) {
        const newVideos = data.videos.map(video => ({
          ...video,
          url: video.url.startsWith("http") ? video.url : (window.CONFIG?.API_URL || "") + video.url
        }));
        setVideos(prev => reset ? newVideos : [...prev, ...newVideos]);
        
        const newLiked = { ...liked };
        const newFollowed = { ...followed };
        const newSaved = { ...saved };
        data.videos.forEach(v => { 
          newLiked[v.id] = v.is_liked;
          newFollowed[v.handle] = v.is_followed; 
          newSaved[v.id] = v.is_saved;
        });
        setLiked(newLiked);
        setFollowed(newFollowed);
        setSaved(newSaved);
        
        if (data.videos.length < 20) setHasMore(false);
        setOffset(currentOffset + 20);
      }
    });
  };

  useEffect(() => {
    loadFeed(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.tagName === "VIDEO") {
            entry.target.play().catch(() => {});
          } else if (entry.target.id === "load-more-sentinel" && hasMore) {
             loadFeed();
          }
        } else if (entry.target.tagName === "VIDEO") {
          entry.target.pause();
          entry.target.currentTime = 0;
        }
      });
    }, { threshold: 0.5 });
    
    document.querySelectorAll("video").forEach((v) => observer.observe(v));
    const sentinel = document.getElementById("load-more-sentinel");
    if (sentinel) observer.observe(sentinel);
    
    return () => observer.disconnect();
  }, [videos, hasMore]);

  async function toggleLike(videoId) {
    const res = await api(`/api/like/${videoId}`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setLiked(prev => ({ ...prev, [videoId]: data.liked }));
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, likes: v.likes + (data.liked ? 1 : -1) } : v));
    }
  }

  async function toggleSave(videoId) {
    const res = await api(`/api/save/${videoId}`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setSaved(prev => ({ ...prev, [videoId]: data.saved }));
    }
  }

  function handleVideoClick(event, videoId) {
    const time = new Date().getTime();
    if (time - (event.currentTarget.lastClick || 0) < 300) {
      // Double tap
      setDoubleTapHeart(videoId);
      setTimeout(() => setDoubleTapHeart(null), 1000);
      if (!liked[videoId]) toggleLike(videoId);
    } else {
      if (event.currentTarget.paused) event.currentTarget.play();
      else event.currentTarget.pause();
    }
    event.currentTarget.lastClick = time;
  }

  function handleShare(video) {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: `Check out this video by ${video.author_name} on SkillTok!`,
        url: window.location.origin,
      }).catch(() => {});
    } else {
      alert("Sharing is not supported on this browser.");
    }
  }

  async function follow(handle) {
    const res = await api("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_handle: handle })
    });
    const data = await res.json();
    if (data.success) {
      setFollowed({ ...followed, [handle]: data.following });
    }
  }

  const feed = videos.length ? videos : [{
    id: "welcome",
    handle: "@SkillTokOfficial",
    author_name: "SkillTok",
    title: "Welcome! Upload the first learning video and start the feed.",
    category: "Welcome",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    likes: 0
  }];

  function blockUser(handle) {
    if (window.confirm(`Block ${handle}? You will no longer see their videos.`)) {
      setBlockedUsers(prev => new Set(prev).add(handle));
      setMenuOpen(null);
    }
  }

  function reportVideo(id) {
    if (window.confirm("Report this video for violating community guidelines?")) {
      alert("Report submitted successfully. We will review this content.");
      setMenuOpen(null);
    }
  }

  async function openComments(videoId) {
    setCommentsModal(videoId);
    setCommentsData([]);
    const res = await api(`/api/comments/${videoId}`);
    const data = await res.json();
    if (data.success) setCommentsData(data.comments);
  }

  async function postComment(event) {
    event.preventDefault();
    if (!newComment.trim() || !commentsModal) return;
    const res = await api(`/api/comments/${commentsModal}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment })
    });
    const data = await res.json();
    if (data.success) {
      setNewComment("");
      openComments(commentsModal); // Refresh
      setVideos(prev => prev.map(v => v.id === commentsModal ? { ...v, comment_count: (v.comment_count || 0) + 1 } : v));
    }
  }

  return (
    <div className="app-container">
      <header className="top-nav">
        <div className="logo brand-row"><LogoIcon /> SkillTok</div>
        <div className="category-scroll">
          {learningCategories.map((category) => <button className={`category-chip ${category === activeCategory ? "active" : ""}`} key={category} onClick={() => setActiveCategory(category)}>{category}</button>)}
        </div>
      </header>
      <main className="video-feed">
        {feed.filter(v => !blockedUsers.has(v.handle)).map((video) => (
          <section className="video-container" key={video.id}>
            <video 
              id={`video-${video.id}`}
              src={video.url} 
              loop 
              playsInline 
              muted={isMuted} 
              onError={(e) => { e.target.src = "https://www.w3schools.com/html/mov_bbb.mp4"; }}
              onClick={(e) => handleVideoClick(e, video.id)}
              onTimeUpdate={(e) => {
                const progress = (e.target.currentTime / e.target.duration) * 100;
                const bar = document.getElementById(`progress-${video.id}`);
                if(bar) bar.style.width = `${progress}%`;

                if (e.target.currentTime > 3 && !viewedVideosRef.current.has(video.id) && video.id !== "welcome") {
                  viewedVideosRef.current.add(video.id);
                  api(`/api/view/${video.id}`, { method: "POST" });
                }
              }}>
            </video>
            
            <button onClick={() => setIsMuted(!isMuted)} style={{position: 'absolute', top: '80px', right: '20px', zIndex: 10, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', color: 'white', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'}}><i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i></button>

            {doubleTapHeart === video.id && (
              <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, color: '#ff0844', fontSize: '100px', animation: 'heartPop 1s ease-out forwards', textShadow: '0 0 20px rgba(0,0,0,0.5)'}}>
                <i className="fa-solid fa-heart"></i>
              </div>
            )}

            <div className="video-overlay-top"></div>
            <div className="video-overlay-bottom"></div>
            
            <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)', zIndex: 5}}>
              <div id={`progress-${video.id}`} style={{height: '100%', background: '#4facfe', width: '0%', transition: 'width 0.1s linear'}}></div>
            </div>

            <aside className="action-sidebar">
              <button className={`action-btn ${liked[video.id] ? "liked" : ""}`} onClick={() => toggleLike(video.id)}><i className="fa-solid fa-heart"></i><span>{video.likes}</span></button>
              <button className="action-btn" onClick={() => openComments(video.id)}><i className="fa-solid fa-comment-dots"></i><span>{video.comment_count || 0}</span></button>
              <button className={`action-btn ${saved[video.id] ? "liked" : ""}`} style={{color: saved[video.id] ? '#f1c40f' : 'white'}} onClick={() => toggleSave(video.id)}><i className="fa-solid fa-bookmark"></i><span>Save</span></button>
              <button className="action-btn" onClick={() => handleShare(video)}><i className="fa-solid fa-share"></i><span>Share</span></button>
              
              <div style={{position: 'relative'}}>
                <button className="action-btn" onClick={() => setMenuOpen(video.id === menuOpen ? null : video.id)}><i className="fa-solid fa-ellipsis-vertical"></i></button>
                {menuOpen === video.id && (
                  <div className="glass-card" style={{position: 'absolute', bottom: '50px', right: '0', zIndex: 10, padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px'}}>
                    <button className="btn-primary compact" style={{background: 'rgba(255,50,50,0.8)', padding: '5px 10px', fontSize: '0.9rem'}} onClick={() => reportVideo(video.id)}><i className="fa-solid fa-flag"></i> Report</button>
                    <button className="btn-primary compact" style={{background: 'rgba(255,50,50,0.8)', padding: '5px 10px', fontSize: '0.9rem'}} onClick={() => blockUser(video.handle)}><i className="fa-solid fa-ban"></i> Block</button>
                  </div>
                )}
              </div>

              <div className="profile-pic" onClick={() => follow(video.handle)}>
                <img src={video.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.author_name)}&background=random&color=fff`} alt="" />
                {!followed[video.handle] ? <div className="follow-badge"><i className="fa-solid fa-plus"></i></div> : <div className="follow-badge" style={{background: '#4facfe'}}><i className="fa-solid fa-check"></i></div>}
              </div>
            </aside>
            <div className="video-info">
              <h2 className="creator-name" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                {video.handle} 
                <span className="category-tag" style={{background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem'}}>{video.category}</span>
                {video.handle !== localStorage.getItem("userHandle") && (
                  <button 
                    className="follow-btn-mini" 
                    onClick={(e) => { e.stopPropagation(); follow(video.handle); }}
                    style={{ background: followed[video.handle] ? 'rgba(255,255,255,0.1)' : '#4facfe', border: followed[video.handle] ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {followed[video.handle] ? 'Following' : 'Follow'}
                  </button>
                )}
              </h2>
              <p className="video-desc">
                {video.title.split(/(\s+)/).map((word, i) => word.startsWith('#') ? <span key={i} style={{color: '#4facfe', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => go('/discover?q=' + encodeURIComponent(word.slice(1)))}>{word}</span> : word)}
              </p>
              <div className="music-ticker"><i className="fa-solid fa-music"></i><span>Original Audio - {video.author_name}</span></div>
            </div>
          </section>
        ))}
        <div id="load-more-sentinel" style={{height: '10px', width: '100%'}}></div>
      </main>

      {commentsModal && (
        <div className="comments-overlay glass-card" style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: '60vh', background: 'rgba(20,20,30,0.95)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '0 -5px 20px rgba(0,0,0,0.5)', padding: '15px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
            <h3 style={{margin: 0}}>Comments</h3>
            <button className="icon-btn" onClick={() => setCommentsModal(null)}><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="comments-list" style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '10px'}}>
            {commentsData.length ? commentsData.map(c => (
              <div key={c.id} style={{display: 'flex', gap: '10px'}}>
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.author_name)}&background=random&color=fff&size=30`} style={{borderRadius: '50%', width: 30, height: 30}} alt="" />
                <div>
                  <div style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold'}}>{c.author_name} <span style={{fontWeight: 'normal'}}>{c.user_handle}</span></div>
                  <div style={{fontSize: '0.9rem', marginTop: '2px'}}>{c.content}</div>
                </div>
              </div>
            )) : <div style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '20px'}}>No comments yet. Be the first to comment!</div>}
          </div>
          <form onSubmit={postComment} style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
            <input type="text" className="form-control" style={{flex: 1, margin: 0, background: 'rgba(255,255,255,0.1)', border: 'none'}} placeholder="Add comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
            <button type="submit" className="btn-primary compact" disabled={!newComment.trim()}><i className="fa-solid fa-paper-plane"></i></button>
          </form>
        </div>
      )}

      <BottomNav active="home" />
    </div>
  );
}

function Discover() {
  const urlParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(urlParams.get("q") || "");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length > 0) {
      api(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => { if (data.success) setResults(data.users); });
    } else {
      setResults([]);
    }
  }, [query]);

  const cards = [
    ["Frontend Dev", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80"],
    ["Business", "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80"],
    ["Graphic Design", "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80"],
    ["Public Speaking", "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80"]
  ];
  return (
    <Shell title="Discover" active="discover">
      <div className="search-bar">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input placeholder="Search users, skills, topics..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      
      {query.length > 0 && (
        <div className="glass-card" style={{marginBottom: '20px'}}>
          <h3 style={{marginBottom: '10px', fontSize: '1rem'}}>Search Results</h3>
          {results.length ? results.map((user) => (
            <div className="search-result-item" key={user.handle} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
              <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`} style={{width: 40, height: 40, borderRadius: '50%'}} alt="" />
                <div>
                  <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{user.name}</div>
                  <div style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)'}}>{user.handle}</div>
                </div>
              </div>
              {user.handle !== localStorage.getItem("userHandle") && (
                <button 
                  className="btn-primary compact" 
                  onClick={() => follow(user.handle)}
                  style={{background: followed[user.handle] ? 'rgba(255,255,255,0.1)' : '#4facfe', color: 'white', minWidth: '80px', border: followed[user.handle] ? '1px solid rgba(255,255,255,0.2)' : 'none'}}
                >
                  {followed[user.handle] ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          )) : <div style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', padding: '10px 0'}}>No users found matching "{query}"</div>}
        </div>
      )}

      <section className="glass-card ai-recommendation"><h3><i className="fa-solid fa-wand-magic-sparkles"></i> AI Picks for You</h3><p>Based on your recent interest in Web Development</p><button className="btn-primary compact">Start Learning React</button></section>
      <h2 className="section-title">Trending Categories <span>See all</span></h2>
      <div className="trending-grid">{cards.map(([label, image]) => <div className="trending-card" key={label} style={{ backgroundImage: `url(${image})` }}><span>{label}</span></div>)}</div>
    </Shell>
  );
}

function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Motivation & Mindset");
  const [status, setStatus] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  function generateThumbnail(videoFile) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(videoFile);
      video.currentTime = 1; 
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => { video.currentTime = 1; };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 600;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      video.onerror = () => resolve("");
    });
  }

  async function handleFileChange(event) {
    const selected = event.target.files[0];
    if (selected) {
      setFile(selected);
      const thumbBase64 = await generateThumbnail(selected);
      setThumbnail(thumbBase64);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!file) return setStatus("Please select a video file.");
    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("category", category);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    setStatus("Uploading... Please wait.");
    const response = await api("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (!data.success) return setStatus(`Upload failed: ${data.message}`);
    setStatus("Upload successful! Redirecting...");
    setTimeout(() => go("/"), 1000);
  }

  return (
    <Shell title="Create" active="upload" back>
      <form onSubmit={submit}>
        <label className="upload-area"><i className="fa-solid fa-cloud-arrow-up"></i><h3>Tap to upload video</h3><p>MP4 or WebM (Max 200 MB)</p><input type="file" accept="video/mp4,video/webm" hidden onChange={handleFileChange} /></label>
        {thumbnail && <div style={{textAlign: 'center', marginBottom: 15}}><img src={thumbnail} alt="Thumbnail preview" style={{width: 100, height: 150, objectFit: 'cover', borderRadius: 10, border: '2px solid #4facfe'}} /></div>}
        {file && <div className="file-selected" style={{marginTop: 5}}>Selected: {file.name}</div>}
        <label className="form-group"><span>Description</span><textarea className="form-control" value={title} required placeholder="What will they learn? #hashtags" onChange={(event) => setTitle(event.target.value)}></textarea></label>
        <label className="form-group"><span>Category</span><select className="form-control" value={category} onChange={(event) => setCategory(event.target.value)}>{["Motivation & Mindset", "Courses & Academics", "Kids Special (Under 12)", "Youth Trends", "Farming & Agriculture", "DIY & Gardening", "World & Culture", "Tech & Coding", "Business & Finance"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="settings-row"><div><strong>Monetization</strong><span>Allow ads on this video</span></div><div className="toggle"><span></span></div></div>
        {status && <div className="status-msg">{status}</div>}
        <button className="btn-submit">Post to SkillTok</button>
      </form>
    </Shell>
  );
}

function Profile() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", avatar_url: "" });
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    api("/api/me").then((res) => res.json()).then((data) => {
      if(data.success) {
        setUser(data.user);
        setEditForm({ name: data.user.name, bio: data.user.bio || "", avatar_url: data.user.avatar_url || "" });
      }
    });
    api("/api/my_videos").then((res) => res.json()).then((data) => {
      if (data.success) {
        setVideos(data.videos.map(video => ({
          ...video,
          url: video.url.startsWith("http") ? video.url : (window.CONFIG?.API_URL || "") + video.url,
          thumbnail_url: video.thumbnail_url ? (video.thumbnail_url.startsWith("http") ? video.thumbnail_url : (window.CONFIG?.API_URL || "") + video.thumbnail_url) : ""
        })));
      }
    });
    api("/api/saved_videos").then((res) => res.json()).then((data) => {
      if (data.success) {
        setSavedVideos(data.videos.map(video => ({
          ...video,
          url: video.url.startsWith("http") ? video.url : (window.CONFIG?.API_URL || "") + video.url,
          thumbnail_url: video.thumbnail_url ? (video.thumbnail_url.startsWith("http") ? video.thumbnail_url : (window.CONFIG?.API_URL || "") + video.thumbnail_url) : ""
        })));
      }
    });
  }, []);

  async function logout() {
    await api("/api/logout", { method: "POST" });
    go("/login");
  }

  async function saveProfile(e) {
    e.preventDefault();
    const res = await api("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm)
    });
    const data = await res.json();
    if(data.success) {
      setUser({ ...user, ...editForm });
      setIsEditing(false);
    }
  }

  async function submitFeedback() {
    if (!feedbackText.trim()) return;
    await api("/api/feedback", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ content: feedbackText }) 
    });
    setFeedbackModal(false);
    setFeedbackText("");
    alert("Thank you for your feedback!");
  }

  const current = user || { name: "Loading...", handle: "@loading", bio: "", avatar_url: "", streak: 0, stats: { videos: 0, views: 0, likes: 0, followers: 0, following: 0 }, badges: [] };
  const avatarImage = current.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(current.name)}&background=4FACFE&color=fff`;

  const displayVideos = activeTab === 0 ? videos : (activeTab === 2 ? savedVideos : []);

  return (
    <Shell title="Profile" active="profile">
      {isEditing ? (
        <form onSubmit={saveProfile} className="glass-card" style={{margin: '20px', padding: '20px'}}>
           <h3>Edit Profile</h3>
           <label className="form-group"><span>Full Name</span><input className="form-control" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></label>
           <label className="form-group"><span>Bio</span><textarea className="form-control" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} /></label>
           <label className="form-group"><span>Avatar URL</span><input className="form-control" value={editForm.avatar_url} onChange={e => setEditForm({...editForm, avatar_url: e.target.value})} /></label>
           <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button type="button" className="btn-edit" onClick={() => setIsEditing(false)} style={{flex: 1, margin: 0}}>Cancel</button>
              <button type="submit" className="btn-primary compact" style={{flex: 1, padding: '10px'}}>Save</button>
           </div>
        </form>
      ) : (
        <section className="profile-header">
          <div className="profile-avatar"><img src={avatarImage} alt="" /></div>
          <h2 className="profile-name">{current.name}</h2>
          <p className="profile-handle">{current.handle}</p>
          {current.bio && <p style={{fontSize: '0.9rem', marginBottom: '15px', color: 'var(--text-secondary)', padding: '0 20px'}}>{current.bio}</p>}
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px'}}>
            <button className="btn-primary compact" style={{background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', margin: 0}} onClick={() => setIsEditing(true)}>Edit Profile</button>
            <button className="btn-primary compact" style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', margin: 0}} onClick={() => setFeedbackModal(true)}><i className="fa-solid fa-comment-dots"></i> Feedback</button>
            <button className="btn-logout" onClick={logout} style={{margin: 0, padding: '5px 15px'}}><i className="fa-solid fa-right-from-bracket"></i></button>
          </div>
          <div className="stats-row">{["videos", "followers", "following", "likes"].map((key) => <div className="stat-box" key={key}><div className="stat-num">{current.stats[key]}</div><div className="stat-label">{key[0].toUpperCase() + key.slice(1)}</div></div>)}</div>
        </section>
      )}
      <section className="gamification-section"><div className="streak-card"><i className="fa-solid fa-fire"></i><div><strong>{current.streak} Days</strong><span>Learning Streak!</span></div></div><div className="badges-card"><span>Earned Badges</span><div className="badge-icons">{current.badges.map((badge) => <i key={badge.name} className={badge.icon} title={badge.name}></i>)}</div></div></section>
      <div className="tabs">{["fa-solid fa-border-all", "fa-solid fa-lock", "fa-solid fa-bookmark", "fa-solid fa-heart"].map((icon, index) => <div className={`tab ${index === activeTab ? "active" : ""}`} key={icon} onClick={() => setActiveTab(index)}><i className={icon}></i></div>)}</div>
      <div className="video-grid">{displayVideos.length ? displayVideos.map((video) => <div className="grid-item" key={video.id}>{video.thumbnail_url ? <img src={video.thumbnail_url} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt=""/> : <video src={video.url} muted loop preload="metadata" onLoadedData={(e) => { e.target.currentTime = 1; }}></video>}<div className="views"><i className="fa-solid fa-play"></i> {video.views}</div></div>) : <Empty icon={activeTab === 2 ? "fa-solid fa-bookmark" : "fa-solid fa-camera"} text={activeTab === 2 ? "No saved videos yet." : "No videos uploaded yet."} />}</div>
      {feedbackModal && (
        <div className="modal-overlay" style={{zIndex: 2000}}>
          <div className="glass-card modal-content" style={{maxWidth: '400px', width: '90%'}}>
            <h3>Give Feedback</h3>
            <p style={{fontSize: '0.9rem', marginBottom: '15px', color: 'rgba(255,255,255,0.7)'}}>Help us improve SkillTok! Your feedback goes directly to our team.</p>
            <textarea 
              className="form-control" 
              placeholder="What's on your mind?" 
              value={feedbackText} 
              onChange={(e) => setFeedbackText(e.target.value)}
              style={{minHeight: '120px', marginBottom: '20px'}}
            ></textarea>
            <div style={{display: 'flex', gap: '10px'}}>
              <button className="btn-primary" onClick={submitFeedback}>Submit</button>
              <button className="btn-edit" onClick={() => setFeedbackModal(false)} style={{margin: 0}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Inbox() {
  const [messages, setMessages] = useState([]);
  const load = () => api("/api/messages").then((res) => res.json()).then((data) => setMessages(data.success ? data.messages : []));
  
  useEffect(() => {
    load();
    const s = getSocket();
    const handleNewMessage = () => load();
    s.on("new_message", handleNewMessage);
    return () => s.off("new_message", handleNewMessage);
  }, []);

  async function send(message) {
    const content = prompt(`Send a message to ${message.other_name}:`);
    if (!content) return;
    const receiver = message.sender_handle === localStorage.getItem("userHandle") ? message.receiver_handle : message.sender_handle;
    await api("/api/messages/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiver_handle: receiver, content }) });
    load();
  }

  return (
    <Shell title="Inbox" active="inbox" right={<button className="icon-btn"><i className="fa-solid fa-pen-to-square"></i></button>}>
      <div className="search-bar"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Search messages..." /></div>
      <div className="message-list">{messages.length ? messages.map((message) => <button className="message-item" key={message.id} onClick={() => send(message)}><div className="msg-avatar"><img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(message.other_name)}&background=random&color=fff`} alt="" /></div><div className="msg-content"><div className="msg-header"><span className="msg-name">{message.other_name}</span><span className="msg-time">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div><div className="msg-preview">{message.sender_handle === localStorage.getItem("userHandle") ? "You: " : ""}{message.content}</div></div></button>) : <Empty icon="fa-solid fa-comments" text="No messages yet. Start a conversation!" />}</div>
    </Shell>
  );
}

function Empty({ icon, text }) {
  return <div className="empty-state"><i className={icon}></i><div>{text}</div></div>;
}

export default function App() {
  const path = useRoute();

  useEffect(() => {
    if (path === "/login" || path === "/signup") return;
    api("/api/me").then((res) => {
      if (res.status === 401) go("/login");
    }).catch(() => go("/login"));
  }, [path]);

  if (path === "/login") return <Login />;
  if (path === "/signup") return <Signup />;
  if (path === "/discover") return <Discover />;
  if (path === "/upload") return <Upload />;
  if (path === "/profile") return <Profile />;
  if (path === "/inbox") return <Inbox />;
  return <Home />;
}
