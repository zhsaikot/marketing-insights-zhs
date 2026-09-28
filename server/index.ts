import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

import analyticsRouter from './routes/analytics.js';
import authGoogleRouter from './routes/auth-google.js';
import authMetaRouter from './routes/auth-meta.js';
import searchConsoleRouter from './routes/search-console.js';
import metaAdsRouter from './routes/meta-ads.js';
import tokensRouter from './routes/tokens.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for local Vite dev server and JSON body parsing
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'Marketing Insights Express Server',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth-google', authGoogleRouter);
app.use('/api/auth-meta', authMetaRouter);
app.use('/api/search-console', searchConsoleRouter);
app.use('/api/meta-ads', metaAdsRouter);
app.use('/api/tokens', tokensRouter);

// Start server
app.listen(PORT, () => {
  const hasGa4ServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const hasGoogleOAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasMetaOAuth = !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
  const hasUpstashRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  console.log(`\n======================================================`);
  console.log(`🚀 Marketing Insights Local API Server running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`------------------------------------------------------`);
  console.log(`📊 GA4 Data API:        ${hasGa4ServiceAccount ? '🟢 Configured (Service Account)' : '⚡ Sandbox Simulation'}`);
  console.log(`🔍 Google OAuth / GSC:  ${hasGoogleOAuth ? '🟢 Configured' : '⚡ Sandbox Simulation'}`);
  console.log(`📱 Meta Ads API:        ${hasMetaOAuth ? '🟢 Configured' : '⚡ Sandbox Simulation'}`);
  console.log(`🔐 Token Vault Storage: ${hasUpstashRedis ? '🟢 Upstash Redis Cloud' : '💾 Local Disk (.data/tokens.json)'}`);
  console.log(`======================================================\n`);
});
