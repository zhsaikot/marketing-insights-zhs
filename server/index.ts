import app from './app.js';
import path from 'path';
import express from 'express';

const PORT = process.env.PORT || 5000;

// Request logging for local development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api') && req.path !== '/api/health') {
        console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });
}

// Unified Production Static File Serving & SPA Fallback
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Centralized API Error Handling Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
});

// Start server
const server = app.listen(PORT, () => {
  const hasGa4ServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const hasGoogleOAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasMetaOAuth = !!(process.env.META_APP_ID && process.env.META_APP_SECRET);
  const hasUpstashRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasPageSpeedKey = !!process.env.GOOGLE_PAGESPEED_API_KEY;

  console.log(`\n======================================================`);
  console.log(`🚀 Marketing Insights Local API Server running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`------------------------------------------------------`);
  console.log(`⚡ PageSpeed API:       ${hasPageSpeedKey ? '🟢 Configured (Google PSI 2h Cache)' : '⚡ Sandbox Simulation'}`);
  console.log(`📊 GA4 Data API:        ${hasGa4ServiceAccount ? '🟢 Configured (Service Account)' : '⚡ Sandbox Simulation'}`);
  console.log(`🔍 Google OAuth / GSC:  ${hasGoogleOAuth ? '🟢 Configured' : '⚡ Sandbox Simulation'}`);
  console.log(`📱 Meta Ads API:        ${hasMetaOAuth ? '🟢 Configured' : '⚡ Sandbox Simulation'}`);
  console.log(`🔐 Token Vault Storage: ${hasUpstashRedis ? '🟢 Upstash Redis Cloud' : '💾 Local Disk (.data/tokens.json)'}`);
  console.log(`======================================================\n`);
});

// Graceful process shutdown
const handleShutdown = (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP connections closed. Process terminating.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
