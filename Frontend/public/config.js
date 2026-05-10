// Configuration for SkillTok Deployment
window.CONFIG = {
    // CHANGE THIS to your Render Backend URL after deployment
    // Example: "https://skilltok-backend.onrender.com"
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
             ? '' 
             : 'https://skilltok-backend.onrender.com' // <-- Put your Render URL here
};
