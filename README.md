# Marketing Insights Platform (ZHS)

A modern, enterprise-grade digital marketing analytics and client workspace dashboard built for marketing agencies, digital consultants, and growth teams.

Consolidates omnichannel performance data across **Google Analytics 4 (GA4)**, **Google Search Console (GSC)**, **Google PageSpeed Insights (PSI)**, and **Meta Business / Ads** into a single unified, reactive interface.

---

## 🚀 Key Features

- **Executive Performance Dashboard:** Real-time KPI summaries, dynamic SVG traffic trajectory charts, keyword ranking distributions, and AI-driven growth recommendations.
- **Google PageSpeed Insights (Core Web Vitals):** Automated periodic audits (Mobile & Desktop) with a 2-hour dual-tier (in-memory + disk) cache, performance scores, LCP/CLS indicators, and diagnostics.
- **Client Workspace Management:** Multi-client management system with brand logo uploads, GA4 Property ID bindings, customizable target goals (monthly sessions & conversions), and role-based permissions (Admin, Editor, Viewer).
- **Omnichannel Data Integrations:** Seamless OAuth & Service Account pipelines for GA4, Google Search Console, and Meta Ads with instant fallback sandbox simulation.
- **Branded Client PDF Reports:** On-demand client reporting with vector tables, visual scorecards, and client customization using `jspdf` and `jspdf-autotable`.

---

## 🛠️ Architecture & Tech Stack

```
marketing-insghts-zhs/
├── server/                 # Express.js 5 API Server (Node.js)
│   ├── routes/             # Dedicated API endpoints (pagespeed, analytics, auth, tokens)
│   └── index.ts            # Server entrypoint with security headers & SPA static host
├── src/                    # Frontend React 18 SPA (Vite 8.3)
│   ├── components/         # Modular UI components (Dashboard, Layout, Widgets)
│   ├── pages/              # Lazy-loaded route views (Dashboard, Performance, Clients, etc.)
│   ├── hooks/              # Custom React hooks (useAuth, etc.)
│   ├── utils/              # Client storage, analytics, and PDF generator utilities
│   └── styles.css          # Modern Sociafy CSS design system with responsive layouts
├── .github/workflows/      # Automated CI/CD pipeline (GitHub Actions)
├── vite.config.ts          # Vite build config with path aliases (@/*) & vendor chunk splitting
└── tsconfig.json           # Modern TypeScript 7.0 compiler options
```

- **Frontend:** React 18, React Router DOM v7, TypeScript, Vite 8.3, Lucide Icons
- **Backend:** Express.js 5, Node.js, TypeScript via `tsx`, Google APIs SDK
- **Data Persistence:** Dual-tier Token Vault (Upstash Redis or local JSON), Client profile state in browser LocalStorage

---

## ⚡ Quickstart & Development

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/zhsaikot/marketing-insights-zhs.git
cd marketing-insghts-zhs

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example .env
```
Fill in your API keys in `.env` as needed:
```env
PORT=5000
GOOGLE_PAGESPEED_API_KEY=your_google_pagespeed_api_key_here
```
*(All keys remain strictly on the backend Express server and are never bundled into frontend assets).*

### 4. Run Development Server
```bash
npm run dev
```
This concurrently boots:
- **Frontend SPA:** `http://localhost:3000` (with live HMR)
- **Backend API:** `http://localhost:5000` (with auto-reloading watcher)

---

## 📦 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both backend Express server and frontend Vite app concurrently. |
| `npm run typecheck` | Validates TypeScript compilation across frontend and backend (`tsc --noEmit`). |
| `npm run build` | Runs typecheck and compiles optimized production assets with chunk splitting. |
| `npm run start` | Boots the Express server in production mode (serves both API & built frontend SPA). |
| `npm run preview` | Previews the built production frontend locally. |

---

## 🌐 Production Deployment

The project is structured to deploy seamlessly as a standalone full-stack service (Render, Railway, VPS, Docker, Heroku):

```bash
# 1. Compile production frontend & typecheck
npm run build

# 2. Start unified full-stack server
npm run start
```
The Express server automatically hosts the static SPA assets from `dist/` and handles client-side routing while serving API endpoints on `/api/*`.

---

## 📄 License
ISC License © [zhsaikot](https://github.com/zhsaikot)
