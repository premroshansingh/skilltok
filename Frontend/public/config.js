// SkillTok Production Configuration
const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const isVercelPreview = window.location.hostname.endsWith(".vercel.app");

window.CONFIG = {
    API_URL: isLocalHost
             ? ""
             : isVercelPreview
               ? "https://skilltok-2.onrender.com"
               : ""
};
