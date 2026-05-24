import { useEffect, useState, useRef, useCallback, Component } from "react";
import { io } from "socket.io-client";
let _setToasts = null;
function toast(msg, type = "info") {
  if (_setToasts) _setToasts((prev) => [...prev, { id: Date.now() + Math.random(), msg, type }]);
}
function confirm(msg) {
  return window.confirm(msg); // keep native confirm for destructive actions only
}
function Toasts() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(1)), 3000);
    return () => clearTimeout(t);
  }, [toasts]);
  if (!toasts.length) return null;
  const colors = { info: "#4facfe", success: "#22c55e", error: "#ff0844", warn: "#f59e0b" };
  return (
    <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none", maxWidth: 340, width: "90%" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: colors[t.type] || colors.info, color: t.type === "warn" ? "#000" : "#fff", padding: "12px 18px", borderRadius: 12, fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "fadeUp 0.3s ease" }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("App error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100dvh", background: "#09090b", color: "white", padding: 30, textAlign: "center" }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "3rem", color: "#ff0844", marginBottom: 20 }}></i>
          <h2 style={{ marginBottom: 10 }}>Something went wrong</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24, fontSize: "0.9rem" }}>{this.state.error.message}</p>
          <button className="btn-primary compact" onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}>Go Home</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Logo ──────────────────────────────────────────────────────────────────────
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

// ── i18n ──────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    home: "Home", discover: "Discover", activity: "Activity", profile: "Profile", upload: "Upload", logout: "Log Out",
    edit: "Edit Profile", stats: "Stats", feedback: "Feedback", skillpaths: "Skill Paths", createpath: "Create Path",
    welcome: "Welcome Back", login_subtitle: "Log in to continue learning", signup_title: "Create Account",
    signup_subtitle: "Join the community", next: "Next Step", finish: "Finish Sign Up", back: "Go Back",
    search_placeholder: "Search users, skills, topics...", followers: "Followers", following: "Following",
    videos: "Videos", likes: "Likes", save: "Save", share: "Share", report: "Report", block: "Block",
    comments: "Comments", post_comment: "Add comment...", analytics_title: "Creator Analytics",
    performance: "Category Performance", close: "Close", watch_later: "Watch Later"
  },
  hi: {
    home: "होम", discover: "खोजें", activity: "गतिविधि", profile: "प्रोफ़ाइल", upload: "अपलोड", logout: "लॉग आउट",
    edit: "संपादित करें", stats: "आंकड़े", feedback: "प्रतिक्रिया", skillpaths: "कौशल पथ", createpath: "पथ बनाएं",
    welcome: "स्वागत है", login_subtitle: "सीखना जारी रखने के लिए लॉगिन करें", signup_title: "खाता बनाएं",
    signup_subtitle: "समुदाय में शामिल हों", next: "अगला कदम", finish: "साइन अप समाप्त करें", back: "पीछे जाएं",
    search_placeholder: "उपयोगकर्ता, कौशल, विषय खोजें...", followers: "अनुयायी", following: "अनुसरण",
    videos: "वीडियो", likes: "पसंद", save: "सहेजें", share: "साझा करें", report: "रिपोर्ट", block: "ब्लॉक",
    comments: "टिप्पणियाँ", post_comment: "टिप्पणी जोड़ें...", analytics_title: "क्रिएटर एनालिटिक्स",
    performance: "श्रेणी प्रदर्शन", close: "बंद करें", watch_later: "बाद में देखें"
  },
  es: {
    home: "Inicio", discover: "Descubrir", activity: "Actividad", profile: "Perfil", upload: "Subir", logout: "Salir",
    edit: "Editar", stats: "Stats", feedback: "Feedback", skillpaths: "Rutas", createpath: "Crear",
    welcome: "Bienvenido", login_subtitle: "Inicia sesión para aprender", signup_title: "Crear cuenta",
    signup_subtitle: "Únete a la comunidad", next: "Siguiente", finish: "Finalizar", back: "Atrás",
    search_placeholder: "Buscar usuarios, temas...", followers: "Seguidores", following: "Siguiendo",
    videos: "Videos", likes: "Likes", save: "Guardar", share: "Compartir", report: "Reportar", block: "Bloquear",
    comments: "Comentarios", post_comment: "Añadir comentario...", analytics_title: "Análisis del creador",
    performance: "Rendimiento por categoría", close: "Cerrar", watch_later: "Ver más tarde"
  }
};

const learningCategories = ["For You", "Motivation", "Courses", "Kids Special", "Youth", "Farming", "World", "Tech", "Business"];

// ── API helper ────────────────────────────────────────────────────────────────
function api(path, options = {}) {
  const baseUrl = window.CONFIG?.API_URL || "";
  return fetch(baseUrl + path, { credentials: "include", ...options });
}

// ── Socket ────────────────────────────────────────────────────────────────────
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

// ── Router ────────────────────────────────────────────────────────────────────
function go(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  const [params, setParams] = useState(new URLSearchParams(window.location.search));
  useEffect(() => {
    const update = () => {
      setPath(window.location.pathname);
      setParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return { path, params };
}

// ── Safe URL helpers ──────────────────────────────────────────────────────────
function mediaUrl(url) {
  if (!url || typeof url !== "string" || url.trim() === "") return "";
  return url.startsWith("http") ? url : (window.CONFIG?.API_URL || "") + url;
}

function avatarUrl(name, url) {
  if (url && typeof url === "string" && url.trim()) return url;
  const safeName = encodeURIComponent((name && typeof name === "string" ? name.trim() : "") || "User");
  return `https://ui-avatars.com/api/?name=${safeName}&background=4facfe&color=fff`;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function BottomNav({ active }) {
  const lang = localStorage.getItem("lang") || "en";
  const t = translations[lang];
  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${active === "home" ? "active" : ""}`} onClick={() => go("/")}><i className="fa-solid fa-house"></i><span>{t.home}</span></button>
      <button className={`nav-item ${active === "discover" ? "active" : ""}`} onClick={() => go("/discover")}><i className="fa-solid fa-magnifying-glass"></i><span>{t.discover}</span></button>
      <button className="nav-item upload-btn" onClick={() => go("/upload")}><i className="fa-solid fa-plus"></i></button>
      <button className={`nav-item ${active === "activity" ? "active" : ""}`} onClick={() => go("/activity")} style={{ position: "relative" }}><i className="fa-solid fa-bell"></i><span>{t.activity}</span></button>
      <button className={`nav-item ${active === "profile" ? "active" : ""}`} onClick={() => go("/profile")}><i className="fa-solid fa-user"></i><span>{t.profile}</span></button>
    </nav>
  );
}

function Shell({ title, active, children, right, back }) {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "default";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);
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
      <input className="form-control" type={type} value={value} required placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
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

function Empty({ icon, text }) {
  return (
    <div className="empty-state">
      <i className={icon}></i>
      <div>{text}</div>
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
function SkeletonFeed() {
  return (
    <div className="video-container" style={{ background: "#000" }}>
      <div className="skeleton" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
}

function SkeletonList({ count = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skel-${i}`} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 8 }}></div>
            <div className="skeleton" style={{ width: "35%", height: 11 }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function Login() {
  const lang = localStorage.getItem("lang") || "en";
  const t = translations[lang];
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) return setError(data.message || "Invalid credentials");
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userHandle", data.user.handle);
      go("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <section className="login-box">
        <h2>{t.welcome}</h2>
        <p>{t.login_subtitle}</p>
        <form onSubmit={submit}>
          <Field label="Username" value={form.username} placeholder="Enter username" onChange={(v) => setForm({ ...form, username: v })} />
          <Field label="Password" type="password" value={form.password} placeholder="Enter password" onChange={(v) => setForm({ ...form, password: v })} />
          {error && <div className="error-msg">{error}</div>}
          <button className="btn-primary" disabled={loading}>{loading ? "Logging in..." : "Log In"}</button>
        </form>
        <div className="auth-link">Don&apos;t have an account? <a href="/signup" onClick={(e) => { e.preventDefault(); go("/signup"); }}>Sign Up</a></div>
      </section>
    </AuthShell>
  );
}

function Signup() {
  const lang = localStorage.getItem("lang") || "en";
  const t = translations[lang];
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", categories: [] });
  const picks = ["Coding", "Business", "Motivation", "SoftSkills", "Courses", "Kids", "Youth", "Farming", "DIY", "World"];

  async function submit() {
    setLoading(true);
    setError("");
    try {
    const res = await api("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) return setError(data.message || "Registration failed");
      localStorage.setItem("userName", form.name);
      localStorage.setItem("userHandle", `@${form.username}`);
      go("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <section className="login-box">
        <h2>{t.signup_title}</h2>
        <p>{t.signup_subtitle}</p>
        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <Field label="Full Name" value={form.name} placeholder="e.g. John Doe" onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Choose Username" value={form.username} placeholder="e.g. johndoe123" onChange={(v) => setForm({ ...form, username: v })} />
            <Field label="Password" type="password" value={form.password} placeholder="Create password" onChange={(v) => setForm({ ...form, password: v })} />
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
                <label key={item}>
                  <input type="checkbox" checked={form.categories.includes(item)} onChange={(e) => {
                    setForm({ ...form, categories: e.target.checked ? [...form.categories, item] : form.categories.filter((c) => c !== item) });
                  }} /> {item}
                </label>
              ))}
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? "Creating..." : "Finish Sign Up"}</button>
            <button className="ghost-btn" onClick={() => setStep(1)}>Go Back</button>
          </>
        )}
        <div className="auth-link">Already have an account? <a href="/login" onClick={(e) => { e.preventDefault(); go("/login"); }}>Log In</a></div>
      </section>
    </AuthShell>
  );
}

// ── Home / Feed ───────────────────────────────────────────────────────────────
function Home() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("For You");
  const [liked, setLiked] = useState({});
  const [followed, setFollowed] = useState({});
  const [saved, setSaved] = useState({});
  const [watchLater, setWatchLater] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [commentsModal, setCommentsModal] = useState(null);
  const [commentsData, setCommentsData] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Per-video mute state — fix: was a single global bool, now a ref so it doesn't re-render
  const mutedRef = useRef(true);
  const [mutedDisplay, setMutedDisplay] = useState(true);
  const [doubleTapHeart, setDoubleTapHeart] = useState(null);
  const viewedVideosRef = useRef(new Set());
  // Fix: store last-tap time per video in a ref, not on the DOM element
  const lastTapRef = useRef({});
  const likedRef = useRef({});
  likedRef.current = liked;

  const loadFeed = useCallback((reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) setIsLoading(true);
    api(`/api/feed?offset=${currentOffset}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const newVideos = data.videos.map((v) => ({
          ...v,
          url: v.url.startsWith("http") ? v.url : (window.CONFIG?.API_URL || "") + v.url
        }));
        setVideos((prev) => reset ? newVideos : [...prev, ...newVideos]);
        // Build state maps from fresh data — use functional updater to avoid stale closure
        setLiked((prev) => {
          const next = reset ? {} : { ...prev };
          data.videos.forEach((v) => { next[v.id] = v.is_liked; });
          return next;
        });
        setFollowed((prev) => {
          const next = reset ? {} : { ...prev };
          data.videos.forEach((v) => { next[v.handle] = v.is_followed; });
          return next;
        });
        setSaved((prev) => {
          const next = reset ? {} : { ...prev };
          data.videos.forEach((v) => { next[v.id] = v.is_saved; });
          return next;
        });
        if (data.videos.length < 20) setHasMore(false);
        setOffset(currentOffset + 20);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [offset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadFeed(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver for autoplay + infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.tagName === "VIDEO") {
          if (entry.isIntersecting) entry.target.play().catch(() => {});
          else { entry.target.pause(); entry.target.currentTime = 0; }
        } else if (entry.target.id === "load-more-sentinel" && entry.isIntersecting && hasMore) {
          loadFeed(false);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll("video[data-feed]").forEach((v) => observer.observe(v));
    const sentinel = document.getElementById("load-more-sentinel");
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [videos, hasMore, loadFeed]);

  async function toggleLike(videoId) {
    const res = await api(`/api/like/${videoId}`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setLiked((prev) => ({ ...prev, [videoId]: data.liked }));
      setVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, likes: v.likes + (data.liked ? 1 : -1) } : v));
    }
  }

  async function toggleSave(videoId) {
    const res = await api(`/api/save/${videoId}`, { method: "POST" });
    const data = await res.json();
    if (data.success) setSaved((prev) => ({ ...prev, [videoId]: data.saved }));
  }

  async function toggleWatchLater(videoId) {
    const res = await api(`/api/watch_later/${videoId}`, { method: "POST" });
    const data = await res.json();
    if (data.success) setWatchLater((prev) => ({ ...prev, [videoId]: data.added }));
  }

  function handleVideoClick(e, videoId) {
    const now = Date.now();
    const last = lastTapRef.current[videoId] || 0;
    if (now - last < 300) {
      setDoubleTapHeart(videoId);
      setTimeout(() => setDoubleTapHeart(null), 1000);
      if (!likedRef.current[videoId]) toggleLike(videoId);
    } else {
      const vid = e.currentTarget;
      if (vid.paused) vid.play().catch(() => {});
      else vid.pause();
    }
    lastTapRef.current[videoId] = now;
  }

  function toggleMute() {
    mutedRef.current = !mutedRef.current;
    setMutedDisplay(mutedRef.current);
    document.querySelectorAll("video[data-feed]").forEach((v) => { v.muted = mutedRef.current; });
  }

  function handleShare(video) {
    if (navigator.share) {
      navigator.share({ title: video.title, text: `Check out this video by ${video.author_name || video.handle} on SkillTok!`, url: window.location.origin }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.origin).then(() => toast("Link copied!", "success")).catch(() => toast("Share not supported on this browser.", "warn"));
    }
  }

  async function follow(handle) {
    const res = await api("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_handle: handle }) });
    const data = await res.json();
    if (data.success) setFollowed((prev) => ({ ...prev, [handle]: data.following }));
  }

  function blockUser(handle) {
    if (confirm(`Block ${handle}? You will no longer see their videos.`)) {
      setBlockedUsers((prev) => new Set(prev).add(handle));
      setMenuOpen(null);
    }
  }

  function reportVideo() {
    toast("Report submitted. We will review this content.", "success");
    setMenuOpen(null);
  }

  async function openComments(videoId) {
    setCommentsModal(videoId);
    setCommentsData([]);
    const res = await api(`/api/comments/${videoId}`);
    const data = await res.json();
    if (data.success) setCommentsData(data.comments);
  }

  async function postComment(e) {
    e.preventDefault();
    if (!newComment.trim() || !commentsModal) return;
    const res = await api(`/api/comments/${commentsModal}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newComment }) });
    const data = await res.json();
    if (data.success) {
      setNewComment("");
      openComments(commentsModal);
      setVideos((prev) => prev.map((v) => v.id === commentsModal ? { ...v, comment_count: (v.comment_count || 0) + 1 } : v));
    }
  }

  const feed = videos.length ? videos : [{ id: "welcome", handle: "@SkillTokOfficial", author_name: "SkillTok", title: "Welcome! Upload the first learning video.", category: "Welcome", url: "https://www.w3schools.com/html/mov_bbb.mp4", likes: 0 }];
  const lang = localStorage.getItem("lang") || "en";
  const t = translations[lang];

  return (
    <div className="app-container">
      <header className="top-nav">
        <div className="logo brand-row"><LogoIcon /> SkillTok</div>
        <div className="category-scroll">
          {learningCategories.map((cat) => (
            <button className={`category-chip ${cat === activeCategory ? "active" : ""}`} key={cat} onClick={() => setActiveCategory(cat)}>{cat}</button>
          ))}
        </div>
      </header>
      <main className="video-feed">
        {isLoading ? <SkeletonFeed /> : feed.filter((v) => !blockedUsers.has(v.handle)).map((video) => (
          <section className="video-container" key={video.id}>
            <video
              data-feed="1"
              src={video.url}
              loop
              playsInline
              muted
              onError={(e) => { e.target.src = "https://www.w3schools.com/html/mov_bbb.mp4"; }}
              onClick={(e) => handleVideoClick(e, video.id)}
              onTimeUpdate={(e) => {
                const bar = document.getElementById(`progress-${video.id}`);
                if (bar && e.target.duration) bar.style.width = `${(e.target.currentTime / e.target.duration) * 100}%`;
                if (e.target.currentTime > 3 && !viewedVideosRef.current.has(video.id) && video.id !== "welcome") {
                  viewedVideosRef.current.add(video.id);
                  api(`/api/view/${video.id}`, { method: "POST" });
                }
              }}
            />
            <button onClick={toggleMute} style={{ position: "absolute", top: 80, right: 20, zIndex: 10, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", color: "white", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className={`fa-solid ${mutedDisplay ? "fa-volume-xmark" : "fa-volume-high"}`}></i>
            </button>
            {doubleTapHeart === video.id && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 20, color: "#ff0844", fontSize: 100, animation: "heartPop 1s ease-out forwards" }}>
                <i className="fa-solid fa-heart"></i>
              </div>
            )}
            <div className="video-overlay-top"></div>
            <div className="video-overlay-bottom"></div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.2)", zIndex: 5 }}>
              <div id={`progress-${video.id}`} style={{ height: "100%", background: "#4facfe", width: "0%", transition: "width 0.1s linear" }}></div>
            </div>
            <aside className="action-sidebar">
              <button className={`action-btn ${liked[video.id] ? "liked" : ""}`} onClick={() => toggleLike(video.id)}><i className="fa-solid fa-heart"></i><span>{video.likes}</span></button>
              <button className="action-btn" onClick={() => openComments(video.id)}><i className="fa-solid fa-comment-dots"></i><span>{video.comment_count || 0}</span></button>
              <button className={`action-btn`} style={{ color: watchLater[video.id] ? "#00f2fe" : "white" }} onClick={() => toggleWatchLater(video.id)}><i className="fa-solid fa-clock"></i><span>{t.watch_later}</span></button>
              <button className={`action-btn`} style={{ color: saved[video.id] ? "#f1c40f" : "white" }} onClick={() => toggleSave(video.id)}><i className="fa-solid fa-bookmark"></i><span>{t.save}</span></button>
              <button className="action-btn" onClick={() => handleShare(video)}><i className="fa-solid fa-share"></i><span>{t.share}</span></button>
              <div style={{ position: "relative" }}>
                <button className="action-btn" onClick={() => setMenuOpen(video.id === menuOpen ? null : video.id)}><i className="fa-solid fa-ellipsis-vertical"></i></button>
                {menuOpen === video.id && (
                  <div className="glass-card" style={{ position: "absolute", bottom: 50, right: 0, zIndex: 10, padding: 10, borderRadius: 10, display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
                    <button className="btn-primary compact" style={{ background: "rgba(255,50,50,0.8)", padding: "5px 10px", fontSize: "0.9rem" }} onClick={reportVideo}><i className="fa-solid fa-flag"></i> Report</button>
                    <button className="btn-primary compact" style={{ background: "rgba(255,50,50,0.8)", padding: "5px 10px", fontSize: "0.9rem" }} onClick={() => blockUser(video.handle)}><i className="fa-solid fa-ban"></i> Block</button>
                  </div>
                )}
              </div>
              <div className="profile-pic" onClick={() => follow(video.handle)} style={{ cursor: "pointer" }}>
                <img src={avatarUrl(video.author_name, video.author_avatar)} alt="" />
                {!followed[video.handle]
                  ? <div className="follow-badge"><i className="fa-solid fa-plus"></i></div>
                  : <div className="follow-badge" style={{ background: "#4facfe" }}><i className="fa-solid fa-check"></i></div>}
              </div>
            </aside>
            <div className="video-info">
              <h2 className="creator-name">
                {video.handle}
                {video.is_expert && <i className="fa-solid fa-circle-check" style={{ color: "#4facfe", fontSize: "0.9rem" }}></i>}
                <span className="category-tag" style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontSize: "0.6rem" }}>{video.category}</span>
                {video.handle !== localStorage.getItem("userHandle") && (
                  <button className="follow-btn-mini" onClick={(e) => { e.stopPropagation(); follow(video.handle); }}
                    style={{ background: followed[video.handle] ? "rgba(255,255,255,0.1)" : "#4facfe", border: followed[video.handle] ? "1px solid rgba(255,255,255,0.2)" : "none", color: "white", padding: "3px 10px", borderRadius: 4, fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>
                    {followed[video.handle] ? "Following" : "Follow"}
                  </button>
                )}
              </h2>
              <p className="video-desc">
                {video.title.split(/(\s+)/).map((word, i) =>
                  word.startsWith("#")
                    ? <span key={`word-${i}`} style={{ color: "#4facfe", cursor: "pointer", fontWeight: "bold" }} onClick={() => go(`/hashtag?tag=${encodeURIComponent(word.slice(1))}`)}>{word}</span>
                    : word
                )}
              </p>
              <div className="music-ticker"><i className="fa-solid fa-music"></i><span>Original Audio - {video.author_name}</span></div>
            </div>
          </section>
        ))}
        <div id="load-more-sentinel" style={{ height: 10, width: "100%" }}></div>
      </main>

      {commentsModal && (
        <div className="comments-overlay glass-card" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60vh", background: "rgba(20,20,30,0.95)", borderTopLeftRadius: 20, borderTopRightRadius: 20, zIndex: 100, display: "flex", flexDirection: "column", padding: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ margin: 0 }}>Comments</h3>
            <button className="icon-btn" onClick={() => setCommentsModal(null)}><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 15, paddingBottom: 10 }}>
            {commentsData.length ? commentsData.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: 10 }}>
                <img src={avatarUrl(c.author_name, null)} style={{ borderRadius: "50%", width: 30, height: 30 }} alt="" />
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontWeight: "bold" }}>{c.author_name} <span style={{ fontWeight: "normal" }}>{c.user_handle}</span></div>
                  <div style={{ fontSize: "0.9rem", marginTop: 2 }}>{c.content}</div>
                </div>
              </div>
            )) : <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginTop: 20 }}>No comments yet. Be the first!</div>}
          </div>
          <form onSubmit={postComment} style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <input type="text" className="form-control" style={{ flex: 1, margin: 0, background: "rgba(255,255,255,0.1)", border: "none" }} placeholder="Add comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <button type="submit" className="btn-primary compact" disabled={!newComment.trim()}><i className="fa-solid fa-paper-plane"></i></button>
          </form>
        </div>
      )}
      <BottomNav active="home" />
    </div>
  );
}

// ── Discover (reworked) ───────────────────────────────────────────────────────
function Discover() {
  const lang = localStorage.getItem("lang") || "en";
  const t = translations[lang];
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], hashtags: [], videos: [] });
  const [trending, setTrending] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [followed, setFollowed] = useState({});
  const [activeTab, setActiveTab] = useState("trending"); // trending | people | rooms
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    Promise.all([
      api("/api/trending").then((r) => r.json()).catch(() => ({ success: false })),
      api("/api/suggested_users").then((r) => r.json()).catch(() => ({ success: false })),
      api("/api/leaderboard").then((r) => r.json()).catch(() => ({ success: false }))
    ]).then(([tData, sData, lData]) => {
      if (tData.success) setTrending(tData.videos);
      if (sData.success) setSuggested(sData.users);
      if (lData.success) setLeaderboard(lData.leaderboard);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchResults({ users: [], hashtags: [], videos: [] }); return; }
    setIsSearching(true);
    searchTimer.current = setTimeout(() => {
      api(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => { if (data.success) setSearchResults({ users: data.users || [], hashtags: data.hashtags || [], videos: data.videos || [] }); })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  async function follow(handle) {
    const res = await api("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_handle: handle }) });
    const data = await res.json();
    if (data.success) setFollowed((prev) => ({ ...prev, [handle]: data.following }));
  }

  const isSearchMode = query.trim().length > 0;
  const studyRooms = [
    { name: "Coding", icon: "fa-solid fa-code", color: "linear-gradient(135deg,#1e3a5f,#4facfe)" },
    { name: "Business", icon: "fa-solid fa-briefcase", color: "linear-gradient(135deg,#1a1a2e,#e94560)" },
    { name: "Motivation", icon: "fa-solid fa-bolt", color: "linear-gradient(135deg,#2d1b69,#a855f7)" },
    { name: "DIY", icon: "fa-solid fa-screwdriver-wrench", color: "linear-gradient(135deg,#1a3a2a,#22c55e)" }
  ];

  return (
    <Shell title={t.discover} active="discover">
      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: 20 }}>
        <i className="fa-solid fa-magnifying-glass" style={{ color: "rgba(255,255,255,0.4)" }}></i>
        <input
          placeholder={t.search_placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }} onClick={() => setQuery("")}><i className="fa-solid fa-xmark"></i></button>}
      </div>

      {/* ── Search results ── */}
      {isSearchMode ? (
        <div>
          {isSearching && <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.5)" }}><i className="fa-solid fa-spinner fa-spin"></i> Searching...</div>}

          {/* Hashtag chips */}
          {searchResults.hashtags.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {searchResults.hashtags.map((h) => (
                <button key={h.title} className="category-chip active" style={{ cursor: "pointer", fontSize: "0.85rem" }}
                  onClick={() => go(`/hashtag?tag=${encodeURIComponent((h.title.split("#")[1] || h.title))}`)}>
                  #{h.title.split("#")[1] || h.title}
                </button>
              ))}
            </div>
          )}

          {/* People results */}
          {searchResults.users.length > 0 && (
            <div className="glass-card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>People</h3>
              {searchResults.users.map((user) => (
                <div key={user.handle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <img src={avatarUrl(user.name, user.avatar_url)} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} alt="" />
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{user.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>{user.handle}</div>
                    </div>
                  </div>
                  {user.handle !== localStorage.getItem("userHandle") && (
                    <button className="btn-primary compact" onClick={() => follow(user.handle)}
                      style={{ background: followed[user.handle] ? "rgba(255,255,255,0.1)" : "#4facfe", border: followed[user.handle] ? "1px solid rgba(255,255,255,0.2)" : "none", color: "white", minWidth: 80 }}>
                      {followed[user.handle] ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Video results */}
          {searchResults.videos.length > 0 && (
            <div className="glass-card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Videos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {searchResults.videos.map((v) => (
                  <div key={v.id} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={() => go("/")}>
                    <div style={{ width: 56, height: 80, borderRadius: 8, overflow: "hidden", background: "#111", flexShrink: 0 }}>
                      {mediaUrl(v.thumbnail_filename)
                        ? <img src={mediaUrl(v.thumbnail_filename)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fa-solid fa-play" style={{ color: "rgba(255,255,255,0.3)" }}></i></div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "bold", fontSize: "0.9rem", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>{v.author_name} · {v.views} views</div>
                      <div style={{ fontSize: "0.7rem", color: "#4facfe", marginTop: 2 }}>{v.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSearching && searchResults.users.length === 0 && searchResults.videos.length === 0 && searchResults.hashtags.length === 0 && (
            <Empty icon="fa-solid fa-magnifying-glass" text={`No results for "${query}"`} />
          )}
        </div>
      ) : (
        /* ── Browse mode ── */
        <>
          {/* Tab switcher */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[["trending", "fa-solid fa-fire", "Trending"], ["people", "fa-solid fa-users", "People"], ["rooms", "fa-solid fa-door-open", "Rooms"]].map(([key, icon, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", fontWeight: "bold", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s",
                  background: activeTab === key ? "linear-gradient(135deg,#00f2fe,#4facfe)" : "rgba(255,255,255,0.07)",
                  color: activeTab === key ? "#000" : "rgba(255,255,255,0.7)" }}>
                <i className={icon} style={{ marginRight: 6 }}></i>{label}
              </button>
            ))}
          </div>

          {isLoading ? <SkeletonList count={6} /> : (
            <>
              {/* ── Trending tab ── */}
              {activeTab === "trending" && (
                <>
                  {/* AI pick banner */}
                  <div className="glass-card ai-recommendation" style={{ marginBottom: 20 }}>
                    <h3><i className="fa-solid fa-wand-magic-sparkles"></i> AI Picks for You</h3>
                    <p>Based on your recent activity in Web Development</p>
                    <button className="btn-primary compact">Start Learning React</button>
                  </div>

                  <h2 className="section-title">Trending Now <span><i className="fa-solid fa-fire" style={{ color: "#ff0844" }}></i></span></h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                    {trending.slice(0, 6).map((v) => (
                      <div key={v.id} style={{ borderRadius: 12, overflow: "hidden", background: "#111", position: "relative", aspectRatio: "9/14", cursor: "pointer" }} onClick={() => go("/")}>
                        {mediaUrl(v.thumbnail_filename)
                          ? <img src={mediaUrl(v.thumbnail_filename)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          : mediaUrl(v.filename)
                            ? <video src={mediaUrl(v.filename)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fa-solid fa-play" style={{ color: "rgba(255,255,255,0.3)", fontSize: "1.5rem" }}></i></div>}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)" }}></div>
                        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: "bold", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)" }}><i className="fa-solid fa-play" style={{ marginRight: 4 }}></i>{v.views} views</div>
                        </div>
                        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", borderRadius: 20, padding: "2px 8px", fontSize: "0.65rem", color: "#4facfe" }}>{v.category}</div>
                      </div>
                    ))}
                  </div>

                  <h2 className="section-title">Global Leaderboard <span>SkillPoints</span></h2>
                  <div className="glass-card" style={{ padding: "10px 15px" }}>
                    {leaderboard.map((u, i) => (
                      <div key={u.handle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i === leaderboard.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ width: 28, fontWeight: "bold", fontSize: "1rem", color: i < 3 ? "#ffcc00" : "rgba(255,255,255,0.4)", textAlign: "center" }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </div>
                        <img src={avatarUrl(u.name, u.avatar_url)} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} alt="" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{u.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>{u.handle}</div>
                        </div>
                        <div style={{ fontWeight: "bold", color: "#4facfe", fontSize: "0.9rem" }}>{u.points} pts</div>
                      </div>
                    ))}
                    {!leaderboard.length && <Empty icon="fa-solid fa-trophy" text="No leaderboard data yet." />}
                  </div>
                </>
              )}

              {/* ── People tab ── */}
              {activeTab === "people" && (
                <>
                  <h2 className="section-title">Suggested for You</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {suggested.map((user) => (
                      <div key={user.handle} className="glass-card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 0 }}>
                        <img src={avatarUrl(user.name, user.avatar_url)} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{user.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>{user.handle}</div>
                          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                            {user.followers_count} followers · {user.video_count} videos
                          </div>
                        </div>
                        <button className="btn-primary compact" onClick={() => follow(user.handle)}
                          style={{ background: followed[user.handle] ? "rgba(255,255,255,0.1)" : "#4facfe", border: followed[user.handle] ? "1px solid rgba(255,255,255,0.2)" : "none", color: "white", minWidth: 80, flexShrink: 0 }}>
                          {followed[user.handle] ? "Following" : "Follow"}
                        </button>
                      </div>
                    ))}
                    {!suggested.length && <Empty icon="fa-solid fa-user-plus" text="No suggestions yet. Explore more!" />}
                  </div>
                </>
              )}

              {/* ── Rooms tab ── */}
              {activeTab === "rooms" && (
                <>
                  <h2 className="section-title">Live Study Rooms</h2>
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>Join a room and learn together in real time.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {studyRooms.map((room) => (
                      <div key={room.name} onClick={() => go(`/studyroom?room=${room.name}`)}
                        style={{ borderRadius: 16, padding: "24px 16px", background: room.color, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "transform 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                        <i className={room.icon} style={{ fontSize: "2rem" }}></i>
                        <span style={{ fontWeight: "bold", fontSize: "1rem" }}>{room.name}</span>
                        <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Join Room</span>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card" style={{ marginTop: 20 }}>
                    <h3 style={{ marginBottom: 8, fontSize: "1rem" }}><i className="fa-solid fa-circle-info" style={{ color: "#4facfe", marginRight: 8 }}></i>How Rooms Work</h3>
                    <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      Study rooms are live chat spaces where learners discuss topics, share resources, and help each other. Messages are real-time via WebSocket.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </Shell>
  );
}

// ── Activity / Notifications (reworked) ──────────────────────────────────────
function Activity() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | likes | follows | comments | saves
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n) => !n.is_read).length);
        }
      })
      .finally(() => setIsLoading(false));

    // Mark all as read after a short delay
    const timer = setTimeout(() => {
      api("/api/notifications/read", { method: "POST" });
      setUnreadCount(0);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const s = getSocket();
    const handleNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    };
    s.on("notification", handleNotif);
    return () => s.off("notification", handleNotif);
  }, []);

  const typeConfig = {
    like:    { label: "liked your video",       icon: "fa-solid fa-heart",        color: "#ff0844" },
    save:    { label: "saved your video",        icon: "fa-solid fa-bookmark",     color: "#f1c40f" },
    follow:  { label: "started following you",   icon: "fa-solid fa-user-plus",    color: "#4facfe" },
    comment: { label: "commented on your video", icon: "fa-solid fa-comment-dots", color: "#a855f7" }
  };

  const filters = [
    { key: "all",      label: "All",      icon: "fa-solid fa-bell" },
    { key: "like",     label: "Likes",    icon: "fa-solid fa-heart" },
    { key: "follow",   label: "Follows",  icon: "fa-solid fa-user-plus" },
    { key: "comment",  label: "Comments", icon: "fa-solid fa-comment-dots" },
    { key: "save",     label: "Saves",    icon: "fa-solid fa-bookmark" }
  ];

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <Shell
      title="Activity"
      active="activity"
      right={
        unreadCount > 0
          ? <div style={{ background: "#ff0844", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "bold" }}>{unreadCount}</div>
          : <span className="spacer"></span>
      }
    >
      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20, scrollbarWidth: "none" }}>
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, border: "none", whiteSpace: "nowrap", cursor: "pointer", fontWeight: "bold", fontSize: "0.8rem", transition: "all 0.2s",
              background: filter === f.key ? "linear-gradient(135deg,#00f2fe,#4facfe)" : "rgba(255,255,255,0.07)",
              color: filter === f.key ? "#000" : "rgba(255,255,255,0.7)" }}>
            <i className={f.icon}></i> {f.label}
          </button>
        ))}
      </div>

      {isLoading ? <SkeletonList count={6} /> : (
        filtered.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((n) => {
              const cfg = typeConfig[n.type] || { label: n.type, icon: "fa-solid fa-bell", color: "#4facfe" };
              return (
                <div key={n.id}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: n.is_read ? "rgba(255,255,255,0.04)" : "rgba(0,242,254,0.06)", borderLeft: n.is_read ? "3px solid transparent" : "3px solid #00f2fe", transition: "all 0.2s" }}>
                  {/* Actor avatar with type icon badge */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={avatarUrl(n.actor_name, n.actor_avatar)} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} alt="" />
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", border: "2px solid #09090b" }}>
                      <i className={cfg.icon}></i>
                    </div>
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>
                      <strong style={{ color: "white" }}>{n.actor_name}</strong>
                      <span style={{ color: "rgba(255,255,255,0.65)" }}> {cfg.label}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{timeAgo(n.timestamp)}</div>
                  </div>
                  {/* Video thumbnail if applicable */}
                  {n.video_id && (
                    <div style={{ width: 40, height: 56, borderRadius: 6, background: "#1a1a2e", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => go("/")}>
                      <i className="fa-solid fa-play" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.3 }}>
              <i className={filter === "all" ? "fa-solid fa-bell-slash" : (typeConfig[filter]?.icon || "fa-solid fa-bell")}></i>
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>
              {filter === "all" ? "No notifications yet." : `No ${filter} notifications yet.`}
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", marginTop: 8 }}>
              When people interact with your content, you&apos;ll see it here.
            </div>
          </div>
        )
      )}

      {/* Messages shortcut */}
      <div className="glass-card" style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => go("/messages")}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#4facfe,#00f2fe)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="fa-solid fa-paper-plane" style={{ color: "#000" }}></i>
        </div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>Direct Messages</div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>Chat with other learners</div>
        </div>
        <i className="fa-solid fa-chevron-right" style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)" }}></i>
      </div>
    </Shell>
  );
}

// ── Upload ────────────────────────────────────────────────────────────────────
function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Motivation & Mindset");
  const [status, setStatus] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [uploading, setUploading] = useState(false);

  function generateThumbnail(videoFile) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => { video.currentTime = 1; };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 600;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve("");
    });
  }

  async function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const thumb = await generateThumbnail(selected);
      setThumbnail(thumb);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) return setStatus("Please select a video file.");
    setUploading(true);
    setStatus("Uploading... Please wait.");
    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", title);
      formData.append("category", category);
      if (thumbnail) formData.append("thumbnail", thumbnail);
      const res = await api("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) return setStatus(`Upload failed: ${data.message || "Unknown error"}`);
      setStatus("Upload successful! Redirecting...");
      setTimeout(() => go("/"), 1200);
    } catch {
      setStatus("Upload failed: Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Shell title="Create" active="upload" back>
      <form onSubmit={submit}>
        <label className="upload-area">
          <i className="fa-solid fa-cloud-arrow-up"></i>
          <h3>Tap to upload video</h3>
          <p>MP4 or WebM (Max 200 MB)</p>
          <input type="file" accept="video/mp4,video/webm" hidden onChange={handleFileChange} />
        </label>
        {thumbnail && (
          <div style={{ textAlign: "center", marginBottom: 15 }}>
            <img src={thumbnail} alt="Thumbnail preview" style={{ width: 100, height: 150, objectFit: "cover", borderRadius: 10, border: "2px solid #4facfe" }} />
          </div>
        )}
        {file && <div className="file-selected" style={{ marginTop: 5 }}>Selected: {file.name}</div>}
        <label className="form-group">
          <span>Description</span>
          <textarea className="form-control" value={title} required placeholder="What will they learn? #hashtags" onChange={(e) => setTitle(e.target.value)}></textarea>
        </label>
        <label className="form-group">
          <span>Category</span>
          <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
            {["Motivation & Mindset", "Courses & Academics", "Kids Special (Under 12)", "Youth Trends", "Farming & Agriculture", "DIY & Gardening", "World & Culture", "Tech & Coding", "Business & Finance"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        {status && <div className="status-msg">{status}</div>}
        <button className="btn-submit" disabled={uploading}>{uploading ? "Uploading..." : "Post to SkillTok"}</button>
      </form>
    </Shell>
  );
}

// ── Study Room ────────────────────────────────────────────────────────────────
function StudyRoom() {
  const { params } = useRoute();
  const room = params.get("room") || "General";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);
  const sock = getSocket();

  useEffect(() => {
    sock.emit("join-room", room);
    const handleMsg = (msg) => setMessages((prev) => [...prev, msg]);
    sock.on("room-message", handleMsg);
    return () => sock.off("room-message", handleMsg);
  }, [room, sock]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    sock.emit("room-message", { room, message: text, sender: localStorage.getItem("userName") || "Anonymous" });
    setText("");
  }

  return (
    <Shell title={`${room} Room`} active="discover" back>
      <div className="chat-area">
        <div className="chat-messages">
          {messages.length === 0 && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginTop: 40 }}>No messages yet. Say hello!</div>}
          {messages.map((m, i) => (
            <div key={`msg-${m.id || i}`} className="chat-bubble">
              <strong>{m.sender}:</strong> {m.message}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <form onSubmit={send} className="chat-input-row">
          <input className="form-control" placeholder="Message the room..." value={text} onChange={(e) => setText(e.target.value)} />
          <button className="icon-btn" style={{ background: "#4facfe" }}><i className="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>
    </Shell>
  );
}

// ── Hashtag Feed ──────────────────────────────────────────────────────────────
function HashtagFeed() {
  const { params } = useRoute();
  const tag = params.get("tag");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tag) {
      api(`/api/hashtags/${encodeURIComponent(tag)}`)
        .then((r) => r.json())
        .then((data) => { if (data.success) setVideos(data.videos); })
        .finally(() => setLoading(false));
    }
  }, [tag]);

  return (
    <Shell title={`#${tag}`} back>
      {loading ? <SkeletonList count={4} /> : (
        <div className="video-grid">
          {videos.map((v) => (
            <div className="grid-item" key={v.id} onClick={() => go("/")}>
              {mediaUrl(v.thumbnail_filename)
                ? <img src={mediaUrl(v.thumbnail_filename)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                : mediaUrl(v.filename)
                  ? <video src={mediaUrl(v.filename)} muted onLoadedData={(e) => { e.target.currentTime = 1; }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "#222" }}></div>}
              <div className="views"><i className="fa-solid fa-play"></i> {v.views}</div>
            </div>
          ))}
          {!videos.length && <Empty icon="fa-solid fa-hashtag" text={`No videos for #${tag} yet.`} />}
        </div>
      )}
    </Shell>
  );
}

// ── Conversations ─────────────────────────────────────────────────────────────
function Conversations() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/conversations")
      .then((r) => r.json())
      .then((data) => { if (data.success) setChats(data.conversations); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell title="Messages" active="activity" back>
      {loading ? <SkeletonList count={5} /> : (
        <div className="notif-list">
          {chats.map((c) => (
            <div key={c.handle} className="notification-item" style={{ cursor: "pointer" }} onClick={() => go(`/chat?handle=${c.handle}`)}>
              <img src={avatarUrl(c.name, c.avatar_url)} alt="" className="notif-avatar" />
              <div className="notif-content">
                <strong>{c.name}</strong>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content}</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8rem" }}></i>
            </div>
          ))}
          {!chats.length && <Empty icon="fa-solid fa-message" text="No conversations yet." />}
        </div>
      )}
    </Shell>
  );
}

// ── Direct Chat ───────────────────────────────────────────────────────────────
function DirectChat() {
  const { params } = useRoute();
  const targetHandle = params.get("handle");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const sock = getSocket();
  const myHandle = localStorage.getItem("userHandle");
  const bottomRef = useRef(null);

  useEffect(() => {
    api("/api/messages")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMessages(data.messages.filter((m) => m.sender_handle === targetHandle || m.receiver_handle === targetHandle).reverse());
        }
      });

    const handleNew = (msg) => {
      if (msg.sender_handle === targetHandle || msg.receiver_handle === targetHandle) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    sock.on("new_message", handleNew);
    return () => sock.off("new_message", handleNew);
  }, [targetHandle, sock]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await api("/api/messages/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiver_handle: targetHandle, content: text }) });
    if ((await res.json()).success) setText("");
  }

  return (
    <Shell title={targetHandle} back>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 80 }}>
        {messages.map((m, i) => (
          <div key={`dm-${m.id || i}`} style={{ alignSelf: m.sender_handle === myHandle ? "flex-end" : "flex-start", background: m.sender_handle === myHandle ? "#4facfe" : "rgba(255,255,255,0.1)", padding: "10px 15px", borderRadius: 15, maxWidth: "80%", color: m.sender_handle === myHandle ? "#000" : "white" }}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>
      <form onSubmit={send} className="chat-input-row" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 15px", background: "rgba(9,9,11,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <input className="form-control" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} style={{ margin: 0 }} />
        <button className="icon-btn" style={{ background: "#4facfe" }}><i className="fa-solid fa-paper-plane"></i></button>
      </form>
    </Shell>
  );
}

// ── Inbox ─────────────────────────────────────────────────────────────────────
function Inbox() {
  const [messages, setMessages] = useState([]);

  const load = useCallback(() => {
    api("/api/messages").then((r) => r.json()).then((data) => setMessages(data.success ? data.messages : []));
  }, []);

  useEffect(() => {
    load();
    const s = getSocket();
    s.on("new_message", load);
    return () => s.off("new_message", load);
  }, [load]);

  async function send(message) {
    const receiver = message.sender_handle === localStorage.getItem("userHandle") ? message.receiver_handle : message.sender_handle;
    go(`/chat?handle=${receiver}`);
  }

  return (
    <Shell title="Inbox" active="inbox" right={<button className="icon-btn"><i className="fa-solid fa-pen-to-square"></i></button>}>
      <div className="search-bar"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Search messages..." /></div>
      <div className="message-list">
        {messages.length ? messages.map((message) => (
          <button className="message-item" key={message.id} onClick={() => send(message)}>
            <div className="msg-avatar"><img src={avatarUrl(message.other_name, null)} alt="" /></div>
            <div className="msg-content">
              <div className="msg-header">
                <span className="msg-name">{message.other_name}</span>
                <span className="msg-time">{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="msg-preview">{message.sender_handle === localStorage.getItem("userHandle") ? "You: " : ""}{message.content}</div>
            </div>
          </button>
        )) : <Empty icon="fa-solid fa-comments" text="No messages yet. Start a conversation!" />}
      </div>
    </Shell>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function Profile() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [watchLaterVideos, setWatchLaterVideos] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", avatar_url: "", banner_url: "" });
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  function normalizeUrl(url) {
    return mediaUrl(url);
  }

  useEffect(() => {
    api("/api/me").then((r) => r.json()).then((data) => {
      if (data.success) {
        setUser(data.user);
        setEditForm({ name: data.user.name, bio: data.user.bio || "", avatar_url: data.user.avatar_url || "", banner_url: data.user.banner_url || "" });
      } else {
        go("/login");
      }
    }).catch(() => go("/login"));

    api("/api/analytics").then((r) => r.json()).then((data) => { if (data.success) setAnalytics(data); });

    api("/api/my_videos").then((r) => r.json()).then((data) => {
      if (data.success) setVideos(data.videos.map((v) => ({ ...v, url: normalizeUrl(v.url), thumbnail_url: normalizeUrl(v.thumbnail_url) })));
    });
    api("/api/saved_videos").then((r) => r.json()).then((data) => {
      if (data.success) setSavedVideos(data.videos.map((v) => ({ ...v, url: normalizeUrl(v.url), thumbnail_url: normalizeUrl(v.thumbnail_url) })));
    });
    api("/api/watch_later").then((r) => r.json()).then((data) => {
      if (data.success) setWatchLaterVideos(data.videos.map((v) => ({ ...v, url: normalizeUrl(v.filename || v.url), thumbnail_url: normalizeUrl(v.thumbnail_filename || v.thumbnail_url) })));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function logout() {
    await api("/api/logout", { method: "POST" });
    localStorage.removeItem("userName");
    localStorage.removeItem("userHandle");
    go("/login");
  }

  async function saveProfile(e) {
    e.preventDefault();
    const res = await api("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    const data = await res.json();
    if (data.success) { setUser({ ...user, ...editForm }); setIsEditing(false); }
  }

  async function submitFeedback() {
    if (!feedbackText.trim()) return;
    await api("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: feedbackText }) });
    setFeedbackModal(false);
    setFeedbackText("");
    toast("Thank you for your feedback!", "success");
  }

  const current = user || { name: "Loading...", handle: "@loading", bio: "", avatar_url: "", banner_url: "", points: 0, streak: 0, stats: { videos: 0, views: 0, likes: 0, followers: 0, following: 0 }, badges: [] };
  const isExpert = current.badges?.some((b) => b.name === "Verified Expert");
  const displayVideos = activeTab === 0 ? videos : activeTab === 2 ? savedVideos : activeTab === 3 ? watchLaterVideos : [];

  return (
    <Shell title="Profile" active="profile">
      {isEditing ? (
        <form onSubmit={saveProfile} className="glass-card" style={{ margin: "0 0 20px", padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Edit Profile</h3>
          <label className="form-group"><span>Full Name</span><input className="form-control" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></label>
          <label className="form-group"><span>Bio</span><textarea className="form-control" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></label>
          <label className="form-group"><span>Avatar URL</span><input className="form-control" value={editForm.avatar_url} onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })} /></label>
          <label className="form-group"><span>Banner URL</span><input className="form-control" value={editForm.banner_url} onChange={(e) => setEditForm({ ...editForm, banner_url: e.target.value })} /></label>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="button" className="ghost-btn" style={{ flex: 1, margin: 0, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: 10 }} onClick={() => setIsEditing(false)}>Cancel</button>
            <button type="submit" className="btn-primary compact" style={{ flex: 1, padding: 10 }}>Save</button>
          </div>
        </form>
      ) : (
        <>
          <div style={{ height: 120, background: current.banner_url ? `url(${current.banner_url}) center/cover` : "linear-gradient(45deg,#1e1b4b,#4facfe)", width: "100%", borderRadius: "0 0 16px 16px" }}></div>
          <section className="profile-header" style={{ marginTop: -50 }}>
            <div className="profile-avatar"><img src={avatarUrl(current.name, current.avatar_url)} alt="" /></div>
            <h2 className="profile-name" style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              {current.name} {isExpert && <i className="fa-solid fa-circle-check" style={{ color: "#4facfe" }}></i>}
            </h2>
            <p style={{ color: "#4facfe", fontWeight: "bold", marginBottom: 4 }}>{current.handle}</p>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>{current.points} SkillPoints · {current.streak} day streak 🔥</p>
            {current.bio && <p style={{ fontSize: "0.9rem", marginBottom: 15, color: "var(--text-secondary)", padding: "0 20px", textAlign: "center" }}>{current.bio}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
              <button className="btn-primary compact" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "white", margin: 0 }} onClick={() => setIsEditing(true)}>Edit</button>
              <button className="btn-primary compact" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", margin: 0 }} onClick={() => setShowAnalytics(true)}><i className="fa-solid fa-chart-line"></i></button>
              <button className="btn-primary compact" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", margin: 0 }} onClick={() => setFeedbackModal(true)}><i className="fa-solid fa-comment-dots"></i></button>
              <select className="btn-primary compact" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: "0.7rem", width: "auto", margin: 0 }} value={localStorage.getItem("theme") || "default"} onChange={(e) => { localStorage.setItem("theme", e.target.value); window.location.reload(); }}>
                <option value="default">Default</option>
                <option value="oled">OLED Black</option>
                <option value="neon">Neon Cyber</option>
              </select>
              <select className="btn-primary compact" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: "0.7rem", width: "auto", margin: 0 }} value={localStorage.getItem("lang") || "en"} onChange={(e) => { localStorage.setItem("lang", e.target.value); window.location.reload(); }}>
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="es">Español</option>
              </select>
              <button className="btn-primary compact" style={{ background: "#ff0844", border: "none", color: "white", margin: 0 }} onClick={logout}><i className="fa-solid fa-right-from-bracket"></i></button>
            </div>
            <div className="stats-row">{["videos", "followers", "following", "likes"].map((key) => (
              <div className="stat-box" key={key}>
                <div className="stat-num">{current.stats?.[key] ?? 0}</div>
                <div className="stat-label">{key[0].toUpperCase() + key.slice(1)}</div>
              </div>
            ))}</div>
          </section>
        </>
      )}

      <section className="gamification-section" style={{ padding: "0 0 0 0", margin: "16px 0" }}>
        <div className="streak-card"><i className="fa-solid fa-fire"></i><div><strong>{current.streak} Days</strong><span>Learning Streak</span></div></div>
        <div className="badges-card"><span>Earned Badges</span><div className="badge-icons">{current.badges?.map((b) => <i key={b.name} className={b.icon} title={b.name}></i>)}</div></div>
      </section>

      <div className="tabs">
        {["fa-solid fa-border-all", "fa-solid fa-list-ul", "fa-solid fa-bookmark", "fa-solid fa-clock"].map((icon, i) => (
          <div className={`tab ${i === activeTab ? "active" : ""}`} key={icon} onClick={() => setActiveTab(i)}><i className={icon}></i></div>
        ))}
      </div>

      {activeTab === 1 && (
        <div style={{ padding: "0 0 16px" }}>
          <button className="btn-primary compact" style={{ width: "100%", background: "rgba(255,255,255,0.1)" }} onClick={() => {
            const name = prompt("Playlist name:");
            if (name) api("/api/playlists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description: "" }) }).then(() => toast("Skill path created!", "success"));
          }}>+ Create New Skill Path</button>
        </div>
      )}

      <div className="video-grid">
        {displayVideos.length ? displayVideos.map((video) => (
          <div className="grid-item" key={video.id}>
            {mediaUrl(video.thumbnail_url)
              ? <img src={mediaUrl(video.thumbnail_url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              : mediaUrl(video.url)
                ? <video src={mediaUrl(video.url)} muted loop preload="metadata" onLoadedData={(e) => { e.target.currentTime = 1; }} />
                : <div style={{ width: "100%", height: "100%", background: "#222" }}></div>}
            <div className="views"><i className="fa-solid fa-play"></i> {video.views}</div>
          </div>
        )) : (
          <Empty
            icon={activeTab === 3 ? "fa-solid fa-clock" : activeTab === 2 ? "fa-solid fa-bookmark" : activeTab === 1 ? "fa-solid fa-list-ul" : "fa-solid fa-camera"}
            text={activeTab === 3 ? "No Watch Later videos." : activeTab === 2 ? "No saved videos yet." : activeTab === 1 ? "No skill paths created." : "No videos uploaded yet."}
          />
        )}
      </div>

      {feedbackModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="glass-card modal-content" style={{ maxWidth: 400, width: "90%" }}>
            <h3>Give Feedback</h3>
            <p style={{ fontSize: "0.9rem", marginBottom: 15, color: "rgba(255,255,255,0.7)" }}>Help us improve SkillTok!</p>
            <textarea className="form-control" placeholder="What's on your mind?" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} style={{ minHeight: 120, marginBottom: 20 }}></textarea>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={submitFeedback}>Submit</button>
              <button className="ghost-btn" style={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 20px" }} onClick={() => setFeedbackModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAnalytics && analytics && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="glass-card modal-content" style={{ maxWidth: 500, width: "90%" }}>
            <h3 style={{ marginBottom: 15 }}><i className="fa-solid fa-chart-line"></i> Creator Analytics</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[["Views", analytics.summary?.total_views], ["Likes", analytics.summary?.total_likes], ["Videos", analytics.summary?.total_videos]].map(([label, val]) => (
                <div key={label} className="stat-box" style={{ background: "rgba(255,255,255,0.05)", padding: 15, borderRadius: 12 }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{val || 0}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{label}</div>
                </div>
              ))}
            </div>
            <h4 style={{ marginBottom: 10 }}>Category Performance</h4>
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 20 }}>
              {analytics.categories?.map((c) => (
                <div key={c.category} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "0.9rem" }}>{c.category}</span>
                  <span style={{ color: "#4facfe", fontWeight: "bold" }}>{c.views} views</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setShowAnalytics(false)}>Close</button>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [verifyRequests, setVerifyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/api/admin/stats").then((r) => r.json()),
      api("/api/admin/videos").then((r) => r.json()),
      api("/api/admin/verify/requests").then((r) => r.json())
    ]).then(([sData, vData, rData]) => {
      if (sData.success) setStats(sData.stats);
      if (vData.success) setVideos(vData.videos);
      if (rData.success) setVerifyRequests(rData.requests);
      setLoading(false);
    });
  }, []);

  async function approveRequest(id) {
    const res = await api(`/api/admin/verify/${id}/approve`, { method: "POST" });
    if ((await res.json()).success) { setVerifyRequests((prev) => prev.filter((r) => r.id !== id)); toast("User verified!", "success"); }
  }

  async function deleteVideo(id) {
    if (!confirm("Delete this video permanently?")) return;
    const res = await api(`/api/admin/video/${id}`, { method: "DELETE" });
    if ((await res.json()).success) setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  if (loading) return <Shell title="Admin" active="profile" back><div style={{ textAlign: "center", marginTop: 50 }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem" }}></i></div></Shell>;

  return (
    <Shell title="Admin Panel" active="profile" back>
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <div className="stat-box"><strong>{stats?.total_users}</strong><span>Users</span></div>
        <div className="stat-box"><strong>{stats?.total_videos}</strong><span>Videos</span></div>
        <div className="stat-box"><strong>{stats?.total_feedback}</strong><span>Feedback</span></div>
      </div>
      <h2 className="section-title">Manage Content</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {videos.map((v) => (
          <div key={v.id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, background: "#333", borderRadius: 5, overflow: "hidden" }}>
                <video src={v.filename} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "0.85rem" }}>{(v.title || "").slice(0, 30)}...</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>by {v.author_name} · {v.views} views</div>
              </div>
            </div>
            <button className="btn-primary compact" style={{ background: "#ff0844" }} onClick={() => deleteVideo(v.id)}><i className="fa-solid fa-trash"></i></button>
          </div>
        ))}
      </div>
      {verifyRequests.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 20 }}>Verification Requests</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {verifyRequests.map((r) => (
              <div key={r.id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
                <div>
                  <div style={{ fontWeight: "bold" }}>{r.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{r.user_handle}</div>
                </div>
                <button className="btn-primary compact" onClick={() => approveRequest(r.id)}>Approve</button>
              </div>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}

// ── App Router ────────────────────────────────────────────────────────────────
export default function App() {
  const { path } = useRoute();

  useEffect(() => {
    if (path === "/login" || path === "/signup") return;
    api("/api/me").then((res) => {
      if (res.status === 401) go("/login");
    }).catch(() => go("/login"));
  }, [path]);

  let Page;
  if (path === "/login")     Page = <Login />;
  else if (path === "/signup")    Page = <Signup />;
  else if (path === "/discover")  Page = <Discover />;
  else if (path === "/upload")    Page = <Upload />;
  else if (path === "/profile")   Page = <Profile />;
  else if (path === "/activity")  Page = <Activity />;
  else if (path === "/studyroom") Page = <StudyRoom />;
  else if (path === "/admin")     Page = <AdminDashboard />;
  else if (path === "/hashtag")   Page = <HashtagFeed />;
  else if (path === "/messages")  Page = <Conversations />;
  else if (path === "/chat")      Page = <DirectChat />;
  else if (path === "/inbox")     Page = <Inbox />;
  else Page = <Home />;

  return (
    <ErrorBoundary>
      <Toasts />
      {Page}
    </ErrorBoundary>
  );
}
