import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { AuthUser } from '../types';

interface IntegrationsProps {
  user: AuthUser;
}

type ConnectionMethod = 'oauth' | 'api';

interface Integration {
  name: string;
  provider: 'google' | 'meta';
  detail: string;
  connected: boolean;
  method?: ConnectionMethod;
  account?: string;
  accountLabel: string;
  accountPlaceholder: string;
  tokenExpiry?: string;
  lastSynced?: string;
}

const defaultIntegrations: Integration[] = [
  {
    name: 'Google Analytics',
    provider: 'google',
    detail: 'Traffic, sessions, active users, and conversions via Google Analytics Data API (GA4).',
    connected: false,
    accountLabel: 'GA4 Property ID',
    accountPlaceholder: 'e.g. 384920184',
    lastSynced: 'Ready to connect',
  },
  {
    name: 'Google Search Console',
    provider: 'google',
    detail: 'Search queries, ranking positions, organic clicks, and impressions via Webmasters API.',
    connected: false,
    accountLabel: 'Website URL Property',
    accountPlaceholder: 'https://acmecommerce.io',
    lastSynced: 'Ready to connect',
  },
  {
    name: 'Meta Business & Ads',
    provider: 'meta',
    detail: 'Paid social campaigns, ad spend, ROAS, CPC, and conversion actions via Meta Graph API.',
    connected: false,
    accountLabel: 'Meta Ad Account ID',
    accountPlaceholder: 'act_1234567890',
    lastSynced: 'Ready to connect',
  },
];

const connectionStorageKey = 'marketing-insights-connections';

export function Integrations({ user }: IntegrationsProps) {
  const isViewer = user.role === 'viewer';

  const [connections, setConnections] = useState<Integration[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(connectionStorageKey) || '{}') as Record<
        string,
        Partial<Integration>
      >;
      return defaultIntegrations.map((integration) => ({
        ...integration,
        ...saved[integration.name],
      }));
    } catch {
      return defaultIntegrations;
    }
  });

  const [openIntegration, setOpenIntegration] = useState<string | null>(null);
  const [method, setMethod] = useState<ConnectionMethod>('oauth');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync token state on mount
  useEffect(() => {
    fetch('/api/tokens')
      .then((res) => (res.ok ? res.json() : null))
      .then((tokens) => {
        if (!tokens) return;
        setConnections((prev) =>
          prev.map((c) => {
            const token = tokens[c.provider];
            if (token && token.accessToken) {
              return {
                ...c,
                connected: true,
                method: 'oauth',
                account: token.account || c.account,
                lastSynced: 'Live Token Synced',
              };
            }
            return c;
          })
        );
      })
      .catch(() => {});
  }, []);

  const configure = (item: Integration) => {
    if (isViewer) return;
    setOpenIntegration(item.name);
    setMethod(item.method || 'oauth');
    setAccount(item.account || '');
    setStatusMessage(null);
  };

  const handleOAuthConnect = async (item: Integration, simulate = false) => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const endpoint = item.provider === 'google' ? '/api/auth-google' : '/api/auth-meta';

      if (simulate) {
        // Instant Sandbox OAuth
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'simulate',
            account: account.trim() || (item.provider === 'google' ? '384920184' : 'act_3948201948'),
          }),
        });

        const data = await res.json();
        if (data.token) {
          // Save to serverless token vault
          await fetch('/api/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.token),
          });

          updateConnectionState(item.name, {
            connected: true,
            method: 'oauth',
            account: data.token.account,
            lastSynced: 'Sandbox Token Active',
          });

          setStatusMessage(`✓ ${item.name} connected successfully via OAuth 2.0!`);
          setTimeout(() => setOpenIntegration(null), 1400);
        }
      } else {
        // Real OAuth 2.0 flow
        const res = await fetch(`${endpoint}?redirect_uri=${encodeURIComponent(window.location.href)}`);
        const json = await res.json();

        if (json.configured && json.authUrl) {
          window.location.href = json.authUrl;
        } else {
          // Provide clear guidance if cloud keys not yet configured
          setStatusMessage(
            json.message ||
              'Cloud OAuth client ID not configured in server environment. Use Instant Sandbox OAuth below to verify live flow immediately.'
          );
        }
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'OAuth authorization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent, item: Integration) => {
    e.preventDefault();
    if (!account.trim()) return;

    updateConnectionState(item.name, {
      connected: true,
      method: 'api',
      account: account.trim(),
      lastSynced: 'Manual Key Configured',
    });

    setStatusMessage(`✓ ${item.name} account credentials saved.`);
    setTimeout(() => setOpenIntegration(null), 1200);
  };

  const updateConnectionState = (name: string, updates: Partial<Integration>) => {
    const next = connections.map((c) => (c.name === name ? { ...c, ...updates } : c));
    setConnections(next);

    const storagePayload = Object.fromEntries(
      next
        .filter((c) => c.connected)
        .map((c) => [c.name, { connected: true, method: c.method, account: c.account }])
    );
    localStorage.setItem(connectionStorageKey, JSON.stringify(storagePayload));
  };

  const disconnect = async (item: Integration) => {
    if (isViewer) return;

    try {
      await fetch(`/api/tokens?provider=${item.provider}`, { method: 'DELETE' });
    } catch {
      // ignore server errors
    }

    updateConnectionState(item.name, {
      connected: false,
      method: undefined,
      account: undefined,
      lastSynced: 'Disconnected',
    });

    if (openIntegration === item.name) {
      setOpenIntegration(null);
    }
  };

  return (
    <div className="page-content">
      <div className="page-intro">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="eyebrow" style={{ margin: 0 }}>Data Pipeline & API Authorization</span>
            <Badge tone={isViewer ? 'warning' : 'positive'}>
              {isViewer ? 'Role: Viewer (Read-Only)' : 'Role: Admin'}
            </Badge>
          </div>
          <h2>Connected Integrations</h2>
          <p className="muted">
            Authorize Google Analytics 4, Search Console, and Meta Business to power unified cross-channel insights.
          </p>
        </div>
      </div>

      {/* RBAC Permission Banner for Viewers */}
      {isViewer && (
        <div
          className="card"
          style={{
            background: '#fff8f0',
            borderLeft: '4px solid var(--yellow)',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '24px' }}>🔒</div>
          <div>
            <strong style={{ color: '#9c6c1e', display: 'block', marginBottom: '2px' }}>
              View-Only Permissions (Freelancer / Client)
            </strong>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
              You have read-only permissions to inspect live metrics. Only Workspace Admins can initiate OAuth 2.0 flows, modify API keys, or disconnect data sources.
            </p>
          </div>
        </div>
      )}

      <div className="integration-grid">
        {connections.map((item) => (
          <Card key={item.name}>
            <div className="integration-icon">{item.name.slice(0, 2).toUpperCase()}</div>
            <h3>{item.name}</h3>
            <p className="muted">{item.detail}</p>

            <div className="integration-action">
              <Badge tone={item.connected ? 'positive' : 'neutral'}>
                {item.connected
                  ? `Connected (${item.account || (item.method === 'oauth' ? 'OAuth 2.0' : 'API')})`
                  : 'Not Connected'}
              </Badge>

              <Button
                variant={item.connected ? 'ghost' : 'secondary'}
                disabled={isViewer}
                title={isViewer ? 'Freelancers and Viewers cannot modify integrations' : undefined}
                style={isViewer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                onClick={() => (item.connected ? disconnect(item) : configure(item))}
              >
                {item.connected ? 'Disconnect' : 'Configure'}
              </Button>
            </div>

            {openIntegration === item.name && !isViewer && (
              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--line)',
                  display: 'grid',
                  gap: '14px',
                }}
              >
                <div className="role-switch">
                  <button
                    type="button"
                    className={method === 'oauth' ? 'selected' : ''}
                    onClick={() => setMethod('oauth')}
                  >
                    <strong>OAuth 2.0</strong>
                    <span>Fast & secure login</span>
                  </button>
                  <button
                    type="button"
                    className={method === 'api' ? 'selected' : ''}
                    onClick={() => setMethod('api')}
                  >
                    <strong>Manual Property ID</strong>
                    <span>Direct property binding</span>
                  </button>
                </div>

                {method === 'oauth' ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <p className="muted" style={{ fontSize: '12px', margin: 0 }}>
                      Authorize {item.name} with one click. Tokens are securely encrypted and stored in your cloud vault.
                    </p>

                    <label style={{ display: 'grid', gap: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                      {item.accountLabel} (Optional)
                      <Input
                        value={account}
                        placeholder={item.accountPlaceholder}
                        onChange={(e) => setAccount(e.target.value)}
                      />
                    </label>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        type="button"
                        onClick={() => handleOAuthConnect(item, false)}
                        disabled={loading}
                      >
                        {loading ? 'Connecting...' : `Connect with ${item.provider === 'google' ? 'Google' : 'Meta'} OAuth`}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleOAuthConnect(item, true)}
                        disabled={loading}
                        title="Simulate instant OAuth 2.0 token acquisition without external credentials"
                      >
                        ⚡ Instant Sandbox OAuth
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpenIntegration(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleManualSave(e, item)} style={{ display: 'grid', gap: '10px' }}>
                    <label style={{ display: 'grid', gap: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                      {item.accountLabel}
                      <Input
                        required
                        value={account}
                        placeholder={item.accountPlaceholder}
                        onChange={(e) => setAccount(e.target.value)}
                      />
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button type="submit">Save Binding</Button>
                      <Button type="button" variant="ghost" onClick={() => setOpenIntegration(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {statusMessage && (
                  <p
                    className="save-note"
                    style={{
                      margin: 0,
                      color: statusMessage.startsWith('✓') ? 'var(--green)' : 'var(--coral)',
                    }}
                  >
                    {statusMessage}
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
