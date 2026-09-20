import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
];

export default async (request: Request) => {
  const url = new URL(request.url);

  try {
    if (request.method === 'GET') {
      const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/integrations`;

      if (!GOOGLE_CLIENT_ID) {
        return new Response(
          JSON.stringify({
            configured: false,
            message: 'GOOGLE_CLIENT_ID not configured on server. You can use OAuth Simulation or configure Google Cloud credentials.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });

      return new Response(JSON.stringify({ configured: true, authUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      const body = (await request.json()) as {
        action?: string;
        code?: string;
        redirectUri?: string;
        account?: string;
      };

      // 1. Sandbox simulation mode
      if (body.action === 'simulate') {
        const mockToken = {
          provider: 'google' as const,
          accessToken: `mock_ga_oauth_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          refreshToken: `mock_ga_refresh_${Date.now()}`,
          account: body.account || '384920184',
          scopes: SCOPES,
          expiresAt: Date.now() + 3600 * 1000,
          connectedAt: new Date().toISOString(),
        };

        // Save via tokens function or return
        return new Response(
          JSON.stringify({
            success: true,
            simulated: true,
            token: mockToken,
            message: 'Google OAuth 2.0 connected in Sandbox Mode.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 2. Real Google OAuth Token Exchange
      const { code, redirectUri, account } = body;
      if (!code) {
        return new Response(JSON.stringify({ error: 'Authorization code is required.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Google OAuth client credentials not set on server.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        redirectUri || `${url.origin}/integrations`
      );

      const { tokens } = await oauth2Client.getToken(code);

      const savedToken = {
        provider: 'google' as const,
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token,
        account: account || 'Auto-Detected',
        scopes: SCOPES,
        expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000,
        connectedAt: new Date().toISOString(),
      };

      return new Response(JSON.stringify({ success: true, token: savedToken }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google OAuth failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

