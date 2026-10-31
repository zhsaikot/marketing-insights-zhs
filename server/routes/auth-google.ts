import { Router, Request, Response } from 'express';
import { google } from 'googleapis';

const router = Router();

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

router.get('/', (req: Request, res: Response) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:3000';
  const defaultRedirect = `${protocol}://${host}/integrations`;
  const redirectUri = (req.query.redirect_uri as string) || process.env.GOOGLE_REDIRECT_URI || defaultRedirect;

  if (!GOOGLE_CLIENT_ID) {
    return res.json({
      configured: false,
      message:
        'GOOGLE_CLIENT_ID not configured on server. Configure Google Cloud credentials in your local .env file.',
    });
  }

  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  return res.json({ configured: true, authUrl });
});

router.post('/', async (req: Request, res: Response) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

  try {
    const { action, code, redirectUri, account } = req.body as {
      action?: string;
      code?: string;
      redirectUri?: string;
      account?: string;
    };

    // 1. Sandbox simulation mode
    if (action === 'simulate') {
      const mockToken = {
        provider: 'google' as const,
        accessToken: `mock_ga_oauth_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        refreshToken: `mock_ga_refresh_${Date.now()}`,
        account: account || '384920184',
        scopes: SCOPES,
        expiresAt: Date.now() + 3600 * 1000,
        connectedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        simulated: true,
        token: mockToken,
        message: 'Google OAuth 2.0 connected in Sandbox Mode.',
      });
    }

    // 2. Real Google OAuth Token Exchange
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required.' });
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Google OAuth client credentials not set on server.' });
    }

    const protocol = req.protocol;
    const host = req.get('host') || 'localhost:3000';
    const defaultRedirect = `${protocol}://${host}/integrations`;
    const targetRedirectUri = redirectUri || process.env.GOOGLE_REDIRECT_URI || defaultRedirect;

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      targetRedirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve user email
    let userEmail = 'Google Account';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      if (userInfo.data.email) {
        userEmail = userInfo.data.email;
      }
    } catch (e) {
      console.warn('[Google OAuth] Could not fetch userinfo:', e);
    }

    // Auto-detect GA4 property
    let detectedPropertyId = account;
    let detectedPropertyName = '';
    try {
      const admin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });
      const summaries = await admin.accountSummaries.list();
      const firstProperty = summaries.data.accountSummaries?.[0]?.propertySummaries?.[0];
      if (firstProperty?.property) {
        detectedPropertyId = firstProperty.property.replace('properties/', '');
        detectedPropertyName = firstProperty.displayName || '';
      }
    } catch (e) {
      console.warn('[Google OAuth] Could not auto-detect GA4 property:', e);
    }

    // Auto-detect Search Console site
    let detectedSiteUrl = '';
    try {
      const sc = google.searchconsole({ version: 'v1', auth: oauth2Client });
      const sites = await sc.sites.list();
      if (sites.data.siteEntry?.[0]?.siteUrl) {
        detectedSiteUrl = sites.data.siteEntry[0].siteUrl;
      }
    } catch (e) {
      console.warn('[Google OAuth] Could not auto-detect Search Console site:', e);
    }

    const savedToken = {
      provider: 'google' as const,
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token,
      account: detectedPropertyId || userEmail,
      email: userEmail,
      propertyName: detectedPropertyName,
      siteUrl: detectedSiteUrl,
      scopes: SCOPES,
      expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000,
      connectedAt: new Date().toISOString(),
    };

    return res.json({ success: true, token: savedToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google OAuth exchange failed';
    console.error('[Google OAuth Error]:', message);
    return res.status(500).json({ error: message });
  }
});

export default router;
