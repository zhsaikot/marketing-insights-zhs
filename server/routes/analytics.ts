import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

type ReportRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

function numberValue(row: ReportRow | undefined, index: number): number {
  return Number(row?.metricValues?.[index]?.value || 0);
}

function percentChange(current: number, previous: number): string {
  if (!previous) return current ? '+100%' : '0%';
  const diff = ((current - previous) / previous) * 100;
  const prefix = diff > 0 ? '+' : '';
  return `${prefix}${diff.toFixed(1)}%`;
}

function parseGoogleCredentials() {
  let value =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  // If no direct env var, check standard local credential file locations
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

  // If value is a file path, read file contents
  if (fs.existsSync(value)) {
    try {
      value = fs.readFileSync(value, 'utf-8');
    } catch (err) {
      console.warn('[GA4] Could not read service account file at:', value, err);
      return null;
    }
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed.private_key) {
      // Correct potential unescaped newlines in private key string from .env
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed as { client_email: string; private_key: string; project_id: string };
  } catch (err) {
    console.error('[GA4] Error parsing Google Service Account JSON:', err);
    return null;
  }
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { propertyId, range, token } = req.body as {
      propertyId?: string;
      range?: string;
      token?: string;
    };

    // 1. Resolve numeric GA4 Property ID
    let rawPropertyId = (propertyId || process.env.GA4_PROPERTY_ID || '').trim();
    rawPropertyId = rawPropertyId.replace(/^properties\//, '').trim();

    // 2. Resolve Auth Client (OAuth2 access token OR Service Account JSON)
    const effectiveToken = token || process.env.GOOGLE_ACCESS_TOKEN || process.env.GA4_ACCESS_TOKEN;
    const serviceAccountCredentials = parseGoogleCredentials();

    let authClient: any = null;

    if (effectiveToken && !effectiveToken.startsWith('mock_')) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: effectiveToken });
      authClient = oauth2Client;
    } else if (serviceAccountCredentials) {
      authClient = new google.auth.GoogleAuth({
        credentials: serviceAccountCredentials,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      });
    }

    // 3. If credentials are not configured or property ID is invalid, provide safe sandbox fallback
    const isPropertyValid = /^\d+$/.test(rawPropertyId);
    if (!authClient || !isPropertyValid) {
      return res.json({
        source: 'sandbox_ga4',
        configured: Boolean(authClient && isPropertyValid),
        propertyId: rawPropertyId || '384920184',
        message: !authClient
          ? 'Google Service Account or Access Token not configured in .env. Running in Sandbox Mode.'
          : 'A numeric GA4 Property ID is required. Using default demonstration property.',
        metrics: [
          { label: 'Sessions', value: '142,500', change: '+14.2%', trend: 'up' },
          { label: 'Conversions', value: '4,890', change: '+9.8%', trend: 'up' },
          { label: 'Active users', value: '108,300', change: '+11.5%', trend: 'up' },
          { label: 'Avg. session duration', value: '165s', change: 'GA4', trend: 'neutral' },
        ],
        traffic: {
          points: [3400, 3900, 4200, 4100, 4600, 4900, 5200, 5600, 6100, 5900, 6400, 6800],
          total: '142,500',
          change: '+14.2%',
          labels: ['Day 1', 'Day 3', 'Day 6', 'Day 9', 'Day 12', 'Day 15', 'Day 18', 'Day 21', 'Day 24', 'Day 27', 'Day 30'],
        },
        keywords: [],
      });
    }

    // 4. Map dynamic reporting date range
    const rangeConfigs: Record<string, { current: string; prevStart: string; prevEnd: string }> = {
      '7d': { current: '7daysAgo', prevStart: '14daysAgo', prevEnd: '8daysAgo' },
      '30d': { current: '30daysAgo', prevStart: '60daysAgo', prevEnd: '31daysAgo' },
      '90d': { current: '90daysAgo', prevStart: '180daysAgo', prevEnd: '91daysAgo' },
      '12m': { current: '365daysAgo', prevStart: '730daysAgo', prevEnd: '366daysAgo' },
    };
    const activeRange = rangeConfigs[range || '30d'] || rangeConfigs['30d'];

    // 5. Execute Live GA4 Data API Call
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: authClient });
    const [currentResult, previousResult] = await Promise.all([
      analyticsData.properties.runReport({
        property: `properties/${rawPropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: activeRange.current, endDate: 'yesterday' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'averageSessionDuration' },
            { name: 'activeUsers' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${rawPropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: activeRange.prevStart, endDate: activeRange.prevEnd }],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'averageSessionDuration' },
            { name: 'activeUsers' },
          ],
        },
      }),
    ]);

    const currentRows = (currentResult.data.rows || []) as ReportRow[];
    const previousRows = (previousResult.data.rows || []) as ReportRow[];
    const totals = currentRows.reduce((sum, row) => sum + numberValue(row, 0), 0);
    const conversions = currentRows.reduce((sum, row) => sum + numberValue(row, 1), 0);
    const activeUsers = currentRows.reduce((sum, row) => sum + numberValue(row, 3), 0);
    const previousTotals = numberValue(previousRows[0], 0);
    const previousConversions = numberValue(previousRows[0], 1);
    const previousActiveUsers = numberValue(previousRows[0], 3);
    const averageDuration = currentRows.length
      ? currentRows.reduce((sum, row) => sum + numberValue(row, 2), 0) / currentRows.length
      : 0;

    return res.json({
      source: 'live_ga4',
      configured: true,
      propertyId: rawPropertyId,
      metrics: [
        {
          label: 'Sessions',
          value: totals.toLocaleString('en-US'),
          change: percentChange(totals, previousTotals),
          trend: totals >= previousTotals ? 'up' : 'down',
        },
        {
          label: 'Conversions',
          value: conversions.toLocaleString('en-US'),
          change: percentChange(conversions, previousConversions),
          trend: conversions >= previousConversions ? 'up' : 'down',
        },
        {
          label: 'Active users',
          value: activeUsers.toLocaleString('en-US'),
          change: percentChange(activeUsers, previousActiveUsers),
          trend: activeUsers >= previousActiveUsers ? 'up' : 'down',
        },
        {
          label: 'Avg. session duration',
          value: `${Math.round(averageDuration)}s`,
          change: 'GA4',
          trend: 'neutral',
        },
      ],
      traffic: {
        points: currentRows.map((row) => numberValue(row, 0)),
        total: totals.toLocaleString('en-US'),
        change: percentChange(totals, previousTotals),
        labels: currentRows.map((row) => row.dimensionValues?.[0]?.value || '').filter(Boolean),
      },
      keywords: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load GA4 data.';
    console.error('[GA4 API Error]:', message);
    return res.status(500).json({ error: message, source: 'error_ga4' });
  }
});

export default router;
