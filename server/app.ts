import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import analyticsRouter from './routes/analytics.js';
import authGoogleRouter from './routes/auth-google.js';
import authMetaRouter from './routes/auth-meta.js';
import searchConsoleRouter from './routes/search-console.js';
import metaAdsRouter from './routes/meta-ads.js';
import tokensRouter from './routes/tokens.js';
import pagespeedRouter from './routes/pagespeed.js';
import auditRouter from './routes/audit.js';

const app = express();

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Configurable CORS & JSON body parsing
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'Marketing Insights Express Server',
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth-google', authGoogleRouter);
app.use('/api/auth-meta', authMetaRouter);
app.use('/api/search-console', searchConsoleRouter);
app.use('/api/meta-ads', metaAdsRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/pagespeed', pagespeedRouter);
app.use('/api/audit', auditRouter);

export default app;
