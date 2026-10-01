import { useState, useEffect } from 'react';
import type { AuthUser } from '../types';
import {
  Plug,
  Activity,
  Globe,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Zap,
  Settings,
  X,
  Lock,
} from 'lucide-react';

interface IntegrationsProps {
  user: AuthUser;
}

type ConnectionMethod = 'oauth' | 'api';

interface Integration {
  name: string;
  provider: 'google' | 'meta';
  category: string;
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
    name: 'Google Analytics 4',
    provider: 'google',
    category: 'Traffic & Engagement',
    detail: 'Live session volumes, funnel conversions, active users, and average session duration via GA4 Data API.',
    connected: false,
    accountLabel: 'GA4 Property ID',
    accountPlaceholder: 'e.g. 384920184',
    lastSynced: 'Ready to connect',
  },
  {
    name: 'Google Search Console',
    provider: 'google',
    category: 'SEO & Organic Ranking',
    detail: 'Top organic search queries, CTR, ranking position velocity, and keyword impressions via Webmasters API.',
    connected: false,
    accountLabel: 'Website Domain URL',
    accountPlaceholder: 'https://acmecommerce.io',
    lastSynced: 'Ready to connect',
  },
  {
    name: 'Meta Business & Ads',
    provider: 'meta',
    category: 'Paid Advertising',
    detail: 'Paid Facebook & Instagram ad spend, purchase ROAS, CPC benchmarks, and ad campaign conversion tracking.',
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
          // Save to local token vault
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
      // ignore
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

  const connectedCount = connections.filter((c) => c.connected).length;
  const currentItem = connections.find((c) => c.name === openIntegration);

  const getIntegrationBadge = (name: string) => {
    if (name.includes('Analytics')) {
      return { icon: Activity, theme: 'green' };
    } else if (name.includes('Search')) {
      return { icon: Globe, theme: 'purple' };
    } else {
      return { icon: DollarSign, theme: 'pink' };
    }
  };

  return (
    <div className="page-content">
      {/* Top Page Intro Header (Sociafy Style) */}
      <div className="page-intro">
        <div>
          <h2>Data Pipeline & Connected APIs</h2>
          <p className="muted">
            Authorize Google Analytics 4, Search Console, and Meta Business to power unified omnichannel intelligence.
          </p>
        </div>
      </div>

      {/* RBAC Permission Banner for Viewers */}
      {isViewer && (
        <div
          style={{
            background: 'var(--white)',
            borderLeft: '4px solid var(--yellow)',
            borderRadius: 'var(--radius-card)',
            padding: '16px 20px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="sociafy-metric-badge pink" style={{ width: '36px', height: '36px' }}>
            <Lock size={18} />
          </div>
          <div>
            <strong style={{ color: 'var(--ink)', display: 'block', fontSize: '13px' }}>
              View-Only Mode (Client / Freelancer)
            </strong>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Only Workspace Admins can initiate OAuth 2.0 flows, modify API bindings, or disconnect data sources.
            </span>
          </div>
        </div>
      )}

      {/* 4 Sociafy-Style KPI Cards for Integrations Suite */}
      <div className="clients-kpi-grid">
        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Pipeline Channels</h4>
            <div className="sociafy-metric-badge green">
              <Plug size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">{connectedCount} / 3</span>
              <span className="sociafy-pill-trend up">
                <CheckCircle2 size={12} /> {Math.round((connectedCount / 3) * 100)}%
              </span>
            </div>
            <span className="sociafy-metric-sub">Active platform feeds</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Google Analytics 4</h4>
            <div className="sociafy-metric-badge purple">
              <Activity size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value" style={{ fontSize: '20px' }}>
                {connections[0].connected ? 'Live Sync' : 'Ready'}
              </span>
              <span className={`sociafy-pill-trend ${connections[0].connected ? 'up' : 'neutral'}`}>
                GA4 Beta
              </span>
            </div>
            <span className="sociafy-metric-sub">Sessions & conversions</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Search Console</h4>
            <div className="sociafy-metric-badge blue">
              <Globe size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value" style={{ fontSize: '20px' }}>
                {connections[1].connected ? 'Live Sync' : 'Ready'}
              </span>
              <span className={`sociafy-pill-trend ${connections[1].connected ? 'up' : 'neutral'}`}>
                GSC API
              </span>
            </div>
            <span className="sociafy-metric-sub">Keyword velocity & ranks</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Meta Business / Ads</h4>
            <div className="sociafy-metric-badge pink">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value" style={{ fontSize: '20px' }}>
                {connections[2].connected ? 'Live Sync' : 'Ready'}
              </span>
              <span className={`sociafy-pill-trend ${connections[2].connected ? 'up' : 'neutral'}`}>
                Graph API
              </span>
            </div>
            <span className="sociafy-metric-sub">Ad spend & purchase ROAS</span>
          </div>
        </div>
      </div>

      {/* Modern 3-Column Integration Cards Grid */}
      <div className="integration-grid">
        {connections.map((item) => {
          const badge = getIntegrationBadge(item.name);
          const Icon = badge.icon;

          return (
            <div
              key={item.name}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '26px',
              }}
            >
              <div>
                {/* Header: Icon + Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div className={`sociafy-metric-badge ${badge.theme}`} style={{ width: '46px', height: '46px', borderRadius: '16px' }}>
                    <Icon size={22} />
                  </div>
                  <span
                    className={`badge ${item.connected ? 'badge-positive' : 'badge-neutral'}`}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    {item.connected ? '● Connected' : '○ Available'}
                  </span>
                </div>

                <span className="eyebrow" style={{ color: 'var(--muted)', margin: '0 0 4px', display: 'block' }}>
                  {item.category}
                </span>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                  {item.name}
                </h3>
                <p className="muted" style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
                  {item.detail}
                </p>

                {/* Account / Property Tag */}
                <div style={{ padding: '10px 14px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 600 }}>
                    {item.accountLabel}
                  </span>
                  <strong style={{ fontSize: '13px', color: 'var(--ink)', wordBreak: 'break-all' }}>
                    {item.account || 'Not configured'}
                  </strong>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>
                  {item.lastSynced}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {item.connected ? (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--coral)' }}
                      disabled={isViewer}
                      onClick={() => disconnect(item)}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button-primary"
                      style={{ padding: '6px 16px', fontSize: '12px' }}
                      disabled={isViewer}
                      onClick={() => configure(item)}
                    >
                      Configure
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure Integration Modern Modal Dialog */}
      {openIntegration && currentItem && !isViewer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setOpenIntegration(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(100%, 540px)',
              padding: '30px',
              borderRadius: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="sociafy-metric-badge green" style={{ width: '36px', height: '36px' }}>
                  <Settings size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                    Configure {currentItem.name}
                  </h3>
                  <span className="muted" style={{ fontSize: '12px' }}>
                    Select connection method and authorize data pipeline
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setOpenIntegration(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Method Segmented Switcher */}
            <div className="pill-segmented-control" style={{ marginBottom: '20px' }}>
              <button
                type="button"
                className={`pill-segmented-btn ${method === 'oauth' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setMethod('oauth')}
              >
                OAuth 2.0 (Recommended)
              </button>
              <button
                type="button"
                className={`pill-segmented-btn ${method === 'api' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setMethod('api')}
              >
                Manual Property ID
              </button>
            </div>

            {method === 'oauth' ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ padding: '14px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink)', lineHeight: 1.5 }}>
                    Authorize {currentItem.name} with one click. Tokens are encrypted and securely stored in your local token vault.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                    {currentItem.accountLabel} (Optional)
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    value={account}
                    placeholder={currentItem.accountPlaceholder}
                    onChange={(e) => setAccount(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => handleOAuthConnect(currentItem, false)}
                    disabled={loading}
                  >
                    {loading ? 'Connecting...' : `Connect with ${currentItem.provider === 'google' ? 'Google' : 'Meta'} OAuth`}
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => handleOAuthConnect(currentItem, true)}
                    disabled={loading}
                    title="Simulate instant OAuth 2.0 token acquisition"
                  >
                    <Zap size={14} style={{ color: 'var(--green)' }} />
                    <span>⚡ Instant Sandbox OAuth</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => handleManualSave(e, currentItem)} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                    {currentItem.accountLabel}
                  </label>
                  <input
                    required
                    className="input"
                    style={{ width: '100%' }}
                    value={account}
                    placeholder={currentItem.accountPlaceholder}
                    onChange={(e) => setAccount(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setOpenIntegration(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button button-primary">
                    Save Binding
                  </button>
                </div>
              </form>
            )}

            {statusMessage && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  background: statusMessage.startsWith('✓') ? '#ecfdf5' : '#fff1f2',
                  color: statusMessage.startsWith('✓') ? 'var(--green)' : 'var(--coral)',
                  fontWeight: 600,
                }}
              >
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
