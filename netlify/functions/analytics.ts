import { google } from 'googleapis';

type ReportRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };

function numberValue(row: ReportRow | undefined, index: number) {
  return Number(row?.metricValues?.[index]?.value || 0);
}

function percentChange(current: number, previous: number) {
  if (!previous) return current ? '100%' : '0%';
  return `${(((current - previous) / previous) * 100).toFixed(1)}%`;
}

function parseCredentials() {
  const value = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!value) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured on the server.');
  return JSON.parse(value) as { client_email: string; private_key: string; project_id: string };
}

export default async (request: Request) => {
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

  try {
    const body = await request.json() as { propertyId?: string };
    const propertyId = body.propertyId?.trim();
    if (!propertyId || !/^\d+$/.test(propertyId)) {
      return new Response(JSON.stringify({ error: 'A numeric GA4 Property ID is required.' }), { status: 400 });
    }

    const credentials = parseCredentials();
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });
    const [currentResult, previousResult] = await Promise.all([
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'averageSessionDuration' }, { name: 'activeUsers' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '60daysAgo', endDate: '31daysAgo' }],
          metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'averageSessionDuration' }, { name: 'activeUsers' }],
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
    const averageDuration = currentRows.length ? currentRows.reduce((sum, row) => sum + numberValue(row, 2), 0) / currentRows.length : 0;

    return new Response(JSON.stringify({
      metrics: [
        { label: 'Sessions', value: totals.toLocaleString('en-US'), change: percentChange(totals, previousTotals), trend: totals >= previousTotals ? 'up' : 'down' },
        { label: 'Conversions', value: conversions.toLocaleString('en-US'), change: percentChange(conversions, previousConversions), trend: conversions >= previousConversions ? 'up' : 'down' },
        { label: 'Active users', value: activeUsers.toLocaleString('en-US'), change: percentChange(activeUsers, previousActiveUsers), trend: activeUsers >= previousActiveUsers ? 'up' : 'down' },
        { label: 'Avg. session duration', value: `${Math.round(averageDuration)}s`, change: 'GA4', trend: 'neutral' },
      ],
      traffic: {
        points: currentRows.map((row) => numberValue(row, 0)),
        total: totals.toLocaleString('en-US'),
        change: percentChange(totals, previousTotals),
        labels: currentRows.map((row) => row.dimensionValues?.[0]?.value || '').filter(Boolean),
      },
      keywords: [],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load GA4 data.';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};