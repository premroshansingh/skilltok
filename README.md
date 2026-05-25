# SkillTok

SkillTok now runs on a Node.js + Express backend and a React + Vite frontend.

## Render setup

Set these environment variables on Render:

- DATABASE_URL: your Render PostgreSQL internal database URL
- SECRET_KEY: any long random string for session cookies
- NODE_ENV: production

Render uses the root Procfile, which installs the backend and frontend, builds React, then starts Backend/server.js.

## Local setup

```bash
npm run install:all
npm run build
npm start
```

For local development, add DATABASE_URL to Backend/.env and run:

```bash
npm run dev
```

Hello Sarthak Bhai 