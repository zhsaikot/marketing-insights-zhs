const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';

export default async (request: Request) => {
  const url = new URL(request.url);

  try {
    if (request.method === 'GET') {
      const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/integrations`;

      if (!META_APP_ID) {
        return new Response(
          JSON.stringify({
            configured: false,
            message: 'META_APP_ID not configured on server. You can use OAuth Simulation or configure Meta Developer App credentials.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
        META_APP_ID
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_read,read_insights`;

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
        adAccountId?: string;
      };

      // 1. Sandbox simulation mode
      if (body.action === 'simulate') {
        const mockToken = {
          provider: 'meta' as const,
          accessToken: `mock_meta_oauth_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          account: body.adAccountId || 'act_3948201948',
          scopes: ['ads_read', 'read_insights'],
          expiresAt: Date.now() + 60 * 86400 * 1000, // 60 days
          connectedAt: new Date().toISOString(),
        };

        return new Response(
          JSON.stringify({
            success: true,
            simulated: true,
            token: mockToken,
            message: 'Meta Business OAuth 2.0 connected in Sandbox Mode.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 2. Live Meta token exchange
      const { code, redirectUri, adAccountId } = body;
      if (!code) {
        return new Response(JSON.stringify({ error: 'Authorization code is required.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(
        META_APP_ID
      )}&redirect_uri=${encodeURIComponent(redirectUri || '')}&client_secret=${encodeURIComponent(
        META_APP_SECRET
      )}&code=${encodeURIComponent(code)}`;

      const res = await fetch(tokenUrl);
      if (!res.ok) {
        const errJson = (await res.json()) as { error?: { message: string } };
        throw new Error(errJson.error?.message || 'Meta token exchange failed.');
      }

      const data = (await res.json()) as { access_token: string; expires_in?: number };

      const savedToken = {
        provider: 'meta' as const,
        accessToken: data.access_token,
        account: adAccountId || 'act_primary',
        scopes: ['ads_read', 'read_insights'],
        expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : Date.now() + 3600 * 1000,
        connectedAt: new Date().toISOString(),
      };

      return new Response(JSON.stringify({ success: true, token: savedToken }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Meta OAuth failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

