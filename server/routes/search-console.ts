import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

function parseGoogleCredentials() {
  let value =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (!value) {
    const candidatePaths = [
      path.resolve(process.cwd(), 'service-account.json'),
      path.resolve(process.cwd(), 'google-credentials.json'),
      path.resolve(process.cwd(), '.data', 'service-account.json'),
    ];
    for (const candPath of candidatePaths) {
      if (fs.existsSync(candPath)) {
        value = candPath;
        break;
      }
    }
  }

  if (!value) return null;

  if (fs.existsSync(value)) {
    try {
      value = fs.readFileSync(value, 'utf-8');
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed as { client_email: string; private_key: string; project_id: string };
  } catch {
    return null;
  }
}

function getGscDateRange(rangeKey = '30d') {
  const daysMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '12m': 365,
  };
  const days = daysMap[rangeKey] || 30;

  // Search Console data has an official 2-3 day lag
  const end = new Date();
  end.setDate(end.getDate() - 3);

  const start = new Date(end);
  start.setDate(start.getDate() - days);

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { siteUrl, token, range } = req.body as {
      siteUrl?: string;
      token?: string;
      range?: string;
    };

    let targetSiteUrl = (siteUrl || process.env.GSC_SITE_URL || 'https://acmecommerce.io').trim();

    // 1. Resolve Auth Client (OAuth2 access token OR Service Account JSON)
    const effectiveToken = token || process.env.GSC_TOKEN || process.env.GOOGLE_ACCESS_TOKEN;
    const serviceAccountCredentials = parseGoogleCredentials();

    let authClient: any = null;

    if (effectiveToken && !effectiveToken.startsWith('mock_')) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: effectiveToken });
      authClient = oauth2Client;
    } else if (serviceAccountCredentials) {
      authClient = new google.auth.GoogleAuth({
        credentials: serviceAccountCredentials,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      });
    }

    // 2. Fallback sandbox data if no real credentials provided
    if (!authClient) {
      const fallbackKeywords = [
        { keyword: 'growth marketing automation', position: 2, volume: '18,500', traffic: '26.4%', change: 3, intent: 'commercial' },
        { keyword: 'enterprise ga4 reporting tool', position: 1, volume: '12,200', traffic: '22.8%', change: 1, intent: 'transactional' },
        { keyword: 'b2b conversion attribution', position: 4, volume: '9,400', traffic: '14.1%', change: 2, intent: 'commercial' },
        { keyword: 'digital marketing client portal', position: 3, volume: '8,100', traffic: '11.5%', change: -1, intent: 'transactional' },
        { keyword: 'search console performance api', position: 5, volume: '6,700', traffic: '9.2%', change: 4, intent: 'informational' },
        { keyword: 'organic session benchmarks', position: 7, volume: '5,300', traffic: '6.4%', change: 0, intent: 'informational' },
        { keyword: 'content cluster ranking strategy', position: 6, volume: '4,900', traffic: '5.1%', change: -2, intent: 'informational' },
      ];

      return res.json({
        source: 'sandbox_gsc',
        configured: false,
        siteUrl: targetSiteUrl,
        totalClicks: 4920,
        totalImpressions: 89400,
        avgCtr: '5.5%',
        avgPosition: '3.4',
        keywords: fallbackKeywords,
      });
    }

    // 3. Live Google Search Console Query with formatted dates (YYYY-MM-DD)
    const { startDate, endDate } = getGscDateRange(range || '30d');
    const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });

    // Try candidate site URLs (exact, trailing slash, or sc-domain)
    const siteUrlCandidates = [
      targetSiteUrl,
      targetSiteUrl.endsWith('/') ? targetSiteUrl.slice(0, -1) : `${targetSiteUrl}/`,
    ];
    if (targetSiteUrl.startsWith('http')) {
      try {
        const parsed = new URL(targetSiteUrl);
        siteUrlCandidates.push(`sc-domain:${parsed.hostname}`);
      } catch {
        // ignore
      }
    }

    let response: any = null;
    let successfulUrl = targetSiteUrl;
    let lastError: Error | null = null;

    for (const candUrl of siteUrlCandidates) {
      try {
        response = await searchconsole.searchanalytics.query({
          siteUrl: candUrl,
          requestBody: {
            startDate,
            endDate,
            dimensions: ['query'],
            rowLimit: 25,
          },
        });
        if (response?.data) {
          successfulUrl = candUrl;
          break;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!response || !response.data) {
      throw lastError || new Error(`Could not query Search Console for ${targetSiteUrl}`);
    }

    const rows = response.data.rows || [];
    const totalClicks = rows.reduce((s: number, r: any) => s + (r.clicks || 0), 0);
    const totalImpressions = rows.reduce((s: number, r: any) => s + (r.impressions || 0), 0);

    const keywords = rows.map((r: any) => ({
      keyword: r.keys?.[0] || 'unknown query',
      position: Math.round(r.position || 0),
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      volume: `${Math.round((r.impressions || 0) * 1.4).toLocaleString()}`,
      traffic: totalClicks > 0 ? `${(((r.clicks || 0) / totalClicks) * 100).toFixed(1)}%` : '0%',
      change: 0,
      intent: 'commercial' as const,
    }));

    return res.json({
      source: 'live_gsc',
      configured: true,
      siteUrl: successfulUrl,
      totalClicks,
      totalImpressions,
      avgCtr: totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(1)}%` : '0%',
      avgPosition: rows.length
        ? (rows.reduce((s: number, r: any) => s + (r.position || 0), 0) / rows.length).toFixed(1)
        : '0',
      keywords,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to query Search Console';
    console.error('[GSC API Error]:', message);
    return res.status(500).json({ error: message, source: 'error_gsc' });
  }
});

export default router;
