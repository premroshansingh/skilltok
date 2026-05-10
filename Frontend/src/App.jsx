import { useEffect, useState } from "react";
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

  useEffect(() => {
    api("/api/feed").then((res) => res.json()).then((data) => {
      if (data.success) {
        setVideos(data.videos.map(video => ({
          ...video,
          url: (window.CONFIG?.API_URL || "") + `/uploads/${video.filename}`,
          likes: video.likes,
          views: video.views
        })));
      }
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else {
          entry.target.pause();
          entry.target.currentTime = 0;
        }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll("video").forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [videos]);

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

  return (
    <div className="app-container">
      <header className="top-nav">
        <div className="logo brand-row"><LogoIcon /> SkillTok</div>
        <div className="category-scroll">
          {learningCategories.map((category) => <button className={`category-chip ${category === activeCategory ? "active" : ""}`} key={category} onClick={() => setActiveCategory(category)}>{category}</button>)}
        </div>
      </header>
      <main className="video-feed">
        {feed.map((video) => (
          <section className="video-container" key={video.id}>
            <video src={video.url} loop playsInline muted={video.id === "welcome"} onClick={(event) => event.currentTarget.paused ? event.currentTarget.play() : event.currentTarget.pause()}></video>
            <div className="video-overlay-top"></div>
            <div className="video-overlay-bottom"></div>
            <aside className="action-sidebar">
              <button className={`action-btn ${liked[video.id] ? "liked" : ""}`} onClick={() => setLiked({ ...liked, [video.id]: !liked[video.id] })}><i className="fa-solid fa-heart"></i><span>{video.likes + (liked[video.id] ? 1 : 0)}</span></button>
              <button className="action-btn"><i className="fa-solid fa-comment-dots"></i><span>{Math.floor(Math.random() * 100)}</span></button>
              <button className="action-btn"><i className="fa-solid fa-bookmark"></i><span>Save</span></button>
              <button className="action-btn"><i className="fa-solid fa-share"></i><span>Share</span></button>
              <div className="profile-pic" onClick={() => follow(video.handle)}>
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(video.author_name)}&background=random&color=fff`} alt="" />
                {!followed[video.handle] && <div className="follow-badge"><i className="fa-solid fa-plus"></i></div>}
              </div>
            </aside>
            <div className="video-info">
              <h2 className="creator-name">{video.handle} <span>{video.category}</span></h2>
              <p className="video-desc">{video.title}</p>
              <div className="music-ticker"><i className="fa-solid fa-music"></i><span>Original Audio - {video.author_name}</span></div>
            </div>
          </section>
        ))}
      </main>
      <BottomNav active="home" />
    </div>
  );
}

function Discover() {
  const cards = [
    ["Frontend Dev", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80"],
    ["Business", "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80"],
    ["Graphic Design", "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80"],
    ["Public Speaking", "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80"]
  ];
  return (
    <Shell title="Discover" active="discover">
      <div className="search-bar"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Search skills, creators, topics..." /></div>
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

  async function submit(event) {
    event.preventDefault();
    if (!file) return setStatus("Please select a video file.");
    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("category", category);
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
        <label className="upload-area"><i className="fa-solid fa-cloud-arrow-up"></i><h3>Tap to upload video</h3><p>MP4 or WebM (Max 200 MB)</p><input type="file" accept="video/mp4,video/webm" hidden onChange={(event) => setFile(event.target.files[0])} /></label>
        {file && <div className="file-selected">Selected: {file.name}</div>}
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

  useEffect(() => {
    api("/api/me").then((res) => res.json()).then((data) => data.success && setUser(data.user));
    api("/api/my_videos").then((res) => res.json()).then((data) => {
      if (data.success) {
        setVideos(data.videos.map(video => ({
          ...video,
          url: (window.CONFIG?.API_URL || "") + `/uploads/${video.filename}`
        })));
      }
    });
  }, []);

  async function logout() {
    await api("/api/logout", { method: "POST" });
    go("/login");
  }

  const current = user || { name: "Loading...", handle: "@loading", streak: 0, stats: { videos: 0, views: 0, likes: 0 }, badges: [] };
  return (
    <Shell title="Profile" active="profile" right={<button className="icon-btn danger" onClick={logout}><i className="fa-solid fa-right-from-bracket"></i></button>}>
      <section className="profile-header"><div className="profile-avatar"><img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(current.name)}&background=4FACFE&color=fff`} alt="" /></div><h2 className="profile-name">{current.name}</h2><p className="profile-handle">{current.handle}</p><div className="stats-row">{["videos", "followers", "following", "likes"].map((key) => <div className="stat-box" key={key}><div className="stat-num">{current.stats[key]}</div><div className="stat-label">{key[0].toUpperCase() + key.slice(1)}</div></div>)}</div></section>
      <section className="gamification-section"><div className="streak-card"><i className="fa-solid fa-fire"></i><div><strong>{current.streak} Days</strong><span>Learning Streak!</span></div></div><div className="badges-card"><span>Earned Badges</span><div className="badge-icons">{current.badges.map((badge) => <i key={badge.name} className={badge.icon} title={badge.name}></i>)}</div></div></section>
      <div className="tabs">{["fa-solid fa-border-all", "fa-solid fa-lock", "fa-solid fa-bookmark", "fa-solid fa-heart"].map((icon, index) => <div className={`tab ${index === 0 ? "active" : ""}`} key={icon}><i className={icon}></i></div>)}</div>
      <div className="video-grid">{videos.length ? videos.map((video) => <div className="grid-item" key={video.id}><video src={video.url} muted loop onMouseEnter={(event) => event.currentTarget.play()} onMouseLeave={(event) => event.currentTarget.pause()}></video><div className="views"><i className="fa-solid fa-play"></i> {video.views}</div></div>) : <Empty icon="fa-solid fa-camera" text="No videos uploaded yet." />}</div>
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
