# Marketing Insights Platform (ZHS) - Comprehensive Repository Summary

---

## 1. Executive Summary & Overview
**Marketing Insights Platform** is an enterprise-grade digital marketing analytics dashboard and client portal built for marketing agencies, digital consultants, and client brands. It consolidates omnichannel performance metrics—including **Google Analytics 4 (GA4)**, **Google Search Console (GSC)**, and **Meta Business / Ads**—into a single unified, interactive interface.

The application allows users to monitor organic traffic trends, keyword rankings, paid ad performance, campaign ROAS, and generate dynamic branded PDF reports for clients, while enforcing strict Role-Based Access Control (Admin, Editor, Viewer).

Originally designed for serverless deployment on Netlify, the application has been refactored into a completely decoupled, self-contained architecture featuring a **Vite + React (TypeScript)** SPA frontend and a dedicated **local Express.js (Node.js)** API backend.

---

## 2. Technical Stack & Architecture

### Frontend (SPA)
- **Framework & Language:** React 19, TypeScript
- **Build Tool:** Vite 8.3 with `@vitejs/plugin-react`
- **Routing:** React Router DOM v7 (`<BrowserRouter>`, `<Routes>`, `<Route>`)
- **Icons & Styling:** Lucide React icons, Vanilla CSS design system with custom CSS variables, responsive grid, light/dark accents, print stylesheets (`@media print`).
- **Reporting Engine:** `jspdf` & `jspdf-autotable` for client-side vector PDF generation.
- **Port:** `http://localhost:3000` (proxies `/api/*` to `http://localhost:5000`).

### Backend (Local API Server)
- **Server:** Node.js with Express.js 5, TypeScript executed via `tsx`
- **Security & Middleware:** `cors`, `dotenv`, JSON body parsing.
- **API Client:** Google APIs SDK (`googleapis`).
- **Data Persistence:** 
  - Token Vault: Dual-tier storage supporting **Upstash Redis REST** (Cloud) with fallback to local JSON file system (`.data/tokens.json`) or in-memory vault.
  - Client & Report entities: Client-side `localStorage` with reactive state synchronization.
- **Port:** `http://localhost:5000`.

### Orchestration & Tooling
- **Concurrent Dev:** `concurrently` runs `npm run server:dev` (`tsx watch server/index.ts`) and `npm run client:dev` (`vite`) simultaneously via a single `npm run dev` command.

---

## 3. Core Functional Modules

### A. Executive Dashboard (`Overview` Tab)
- **KPI Summary Cards:** Real-time metrics for Organic Sessions, Total Conversions, Active Users, and Meta Ad Spend / ROAS with percentage changes and trend indicators.
- **Dynamic Traffic Chart (`TrafficChart.tsx`):** Custom SVG-based area chart with gradient fill, normalized dynamic coordinates (preventing clipping for large session numbers), and hover tooltips.
- **Channel Segmentation:** Filter views across *All Channels*, *Organic Search*, and *Meta Ads*.
- **Live Pipeline Status Bar:** Real-time visual indicator showing connected API token status (GA4, GSC, Meta).
- **Top Organic Keywords Table (`KeywordsTable.tsx`):** Displays keyword queries, current rank position, change indicator, traffic share, estimated volume, and search intent tags (commercial, transactional, informational).
- **Automated AI Insights Panel (`InsightsPanel.tsx`):** Categorized operational insights (Wins, Opportunities, Warnings) with dismiss functionality and impact tags.
- **Timeframe Selector:** Switches between `7d`, `30d`, `90d`, and `12m`.

### B. Integrations & API Authorization (`Integrations` Tab)
- Integrates with 3 primary channels:
  1. **Google Analytics 4 (GA4):** Connects via OAuth 2.0 or manual Property ID binding.
  2. **Google Search Console (GSC):** Connects via OAuth 2.0 or manual domain property binding.
  3. **Meta Business & Ads:** Connects via Facebook OAuth dialog or manual Ad Account ID.
- **Instant Sandbox OAuth (⚡):** Built-in simulation flow that allows complete end-to-end testing without external API credentials or cloud project setup.
- **Token Vault Management:** Secure token storage, retrieval, and revocation (Disconnect action).

### C. Client & Workspace Management (`Clients` Tab)
- Multi-client management system enabling agencies to manage multiple brand workspaces (e.g., Acme Commerce, Northstar Agency, Apex Media).
- Full CRUD operations: Create, update, search, filter, and delete client profiles.
- Role management per client member (Admin, Editor, Viewer).
- Active Client switcher in the Topbar for seamless workspace switching.

### D. Automated PDF & CSV Reporting (`Reports` Tab)
- **Dynamic PDF Generator (`pdf-generator.ts`):** Client-side PDF generation generating an A4 branded document with emerald headers, executive KPI cards, keyword rankings table, channel attribution breakdown, and timestamped footers.
- **CSV Export:** Instant data export for spreadsheet analysis.
- **Interactive Report Preview:** In-app modal preview before exporting.

### E. Role-Based Access Control (RBAC)
- **Roles:**
  - `Admin`: Full permissions across integrations, client management, reports, and data configuration.
  - `Editor`: Can generate reports and edit client profiles, cannot disconnect integrations.
  - `Viewer` (Freelancer/Client): Read-only mode. Restricted from connecting/disconnecting APIs, adding/deleting clients, or creating reports.
- Includes an interactive in-app Role Switcher toolbar for testing permissions on the fly.

---

## 4. API Endpoints & Backend Architecture

| Endpoint | Method | Description | Handled By |
|---|---|---|---|
| `/api/health` | `GET` | Health check & server status | `server/index.ts` |
| `/api/analytics` | `POST` | Fetches sessions, conversions, users from GA4 Data API | `server/routes/analytics.ts` |
| `/api/auth-google` | `GET`, `POST` | Generates Google OAuth URL & handles code exchange / sandbox simulation | `server/routes/auth-google.ts` |
| `/api/auth-meta` | `GET`, `POST` | Generates Meta OAuth URL & handles code exchange / sandbox simulation | `server/routes/auth-meta.ts` |
| `/api/search-console` | `POST` | Queries Search Console API or serves high-fidelity query fallbacks | `server/routes/search-console.ts` |
| `/api/meta-ads` | `POST` | Queries Meta Graph API for spend/ROAS or serves fallback data | `server/routes/meta-ads.ts` |
| `/api/tokens` | `GET`, `POST`, `DELETE` | CRUD endpoints for OAuth tokens in vault (Redis or local disk) | `server/routes/tokens.ts` |

---

## 5. Security & Secret Handling
- **Server-Side Isolation:** All external API secrets (`GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_CLIENT_SECRET`, `META_APP_SECRET`, `UPSTASH_REDIS_REST_TOKEN`) reside exclusively on the server in `.env` and are never bundled into the client build.
- **Client Security:** Vite frontend only accesses environment variables prefixed with `VITE_`.
- **Git Protection:** `.env`, `.env.*`, and `.data/` (local token vault file) are explicitly ignored in `.gitignore`.

---

## 6. Directory Structure

```text
marketing-insghts-zhs/
├── server/                           # Local Express.js backend
│   ├── index.ts                      # Express entrypoint & route registration
│   └── routes/
│       ├── analytics.ts              # GA4 Data API route
│       ├── auth-google.ts            # Google OAuth & sandbox route
│       ├── auth-meta.ts              # Meta OAuth & sandbox route
│       ├── meta-ads.ts               # Meta Ads Graph API route
│       ├── search-console.ts         # Google Search Console route
│       └── tokens.ts                 # Token vault CRUD route
├── src/                              # React SPA frontend
│   ├── components/
│   │   ├── auth/                     # Authentication components (AuthScreen.tsx)
│   │   ├── dashboard/                # InsightsPanel, KeywordsTable, TrafficChart
│   │   ├── layout/                   # Sidebar, Topbar
│   │   └── ui/                       # Badge, Button, Card, Input
│   ├── hooks/                        # useAuth.tsx (Auth & RBAC context)
│   ├── pages/                        # Dashboard, Clients, Integrations, Reports, Profile
│   ├── types/                        # Core TypeScript interfaces & types
│   ├── utils/                        # analytics.ts, clients.ts, reports.ts, pdf-generator.ts
│   ├── App.tsx                       # Main React Router setup
│   ├── main.tsx                      # Vite React mount
│   └── styles.css                    # Unified CSS design system & print styles
├── .env.example                      # Template for server environment variables
├── package.json                      # Dependencies and npm scripts
├── tsconfig.json                     # TypeScript compiler configuration (src + server)
└── vite.config.ts                    # Vite configuration with /api reverse proxy
```

---

## 7. How to Run & Test
1. **Install dependencies:** `npm install`
2. **Setup environment (Optional):** Copy `.env.example` to `.env` and add real credentials if available. (Without credentials, the app defaults to Sandbox Mode automatically).
3. **Start local environment:** `npm run dev`
   - Frontend starts on `http://localhost:3000`
   - Backend API starts on `http://localhost:5000`
