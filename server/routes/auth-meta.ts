import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const META_APP_ID = process.env.META_APP_ID || '';

  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:3000';
  const defaultRedirect = `${protocol}://${host}/integrations`;
  const redirectUri = (req.query.redirect_uri as string) || defaultRedirect;

  if (!META_APP_ID) {
    return res.json({
      configured: false,
      message:
        'META_APP_ID not configured on server. You can use OAuth Simulation or configure Meta Developer App credentials in your local .env file.',
    });
  }

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
    META_APP_ID
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_read,read_insights`;

  return res.json({ configured: true, authUrl });
});

router.post('/', async (req: Request, res: Response) => {
  const META_APP_ID = process.env.META_APP_ID || '';
  const META_APP_SECRET = process.env.META_APP_SECRET || '';

  try {
    const { action, code, redirectUri, adAccountId } = req.body as {
      action?: string;
      code?: string;
      redirectUri?: string;
      adAccountId?: string;
    };

    // 1. Sandbox simulation mode
    if (action === 'simulate') {
      const mockToken = {
        provider: 'meta' as const,
        accessToken: `mock_meta_oauth_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        account: adAccountId || 'act_3948201948',
        scopes: ['ads_read', 'read_insights'],
        expiresAt: Date.now() + 60 * 86400 * 1000, // 60 days
        connectedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        simulated: true,
        token: mockToken,
        message: 'Meta Business OAuth 2.0 connected in Sandbox Mode.',
      });
    }

    // 2. Live Meta token exchange
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required.' });
    }

    if (!META_APP_ID || !META_APP_SECRET) {
      return res.status(500).json({ error: 'Meta OAuth credentials not set in local .env.' });
    }

    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(
      META_APP_ID
    )}&redirect_uri=${encodeURIComponent(redirectUri || '')}&client_secret=${encodeURIComponent(
      META_APP_SECRET
    )}&code=${encodeURIComponent(code)}`;

    const response = await fetch(tokenUrl);
    if (!response.ok) {
      const errJson = (await response.json()) as { error?: { message: string } };
      throw new Error(errJson.error?.message || 'Meta token exchange failed.');
    }

    const data = (await response.json()) as { access_token: string; expires_in?: number };

    const savedToken = {
      provider: 'meta' as const,
      accessToken: data.access_token,
      account: adAccountId || 'act_primary',
      scopes: ['ads_read', 'read_insights'],
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : Date.now() + 3600 * 1000,
      connectedAt: new Date().toISOString(),
    };

    return res.json({ success: true, token: savedToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Meta OAuth failed';
    return res.status(500).json({ error: message });
  }
});

export default router;
