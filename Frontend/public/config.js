// SkillTok Production Configuration
window.CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
             ? ''
             : 'https://skilltok-2.onrender.com'
};
