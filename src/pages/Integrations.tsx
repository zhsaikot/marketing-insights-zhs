import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { isDemoModeActive, setDemoModeActive } from '../utils/analytics';

type ConnectionMethod = 'oauth' | 'api';
interface Integration {
  name: string;
  detail: string;
  connected: boolean;
  method?: ConnectionMethod;
  account?: string;
  accountLabel: string;
  accountPlaceholder: string;
  lastSynced?: string;
}

const defaultIntegrations: Integration[] = [
  {
    name: 'Google Analytics',
    detail: 'Traffic, sessions, user behavior and conversion events (GA4).',
    connected: false,
    accountLabel: 'GA4 Property ID (numeric)',
    accountPlaceholder: 'e.g. 384920184',
    lastSynced: 'Live ready',
  },
  {
    name: 'Google Search Console',
    detail: 'Organic search impressions, clicks, keyword rank, and CTR.',
    connected: false,
    accountLabel: 'Verified Website URL',
    accountPlaceholder: 'https://example.com',
    lastSynced: 'Ready to connect',
  },
  {
    name: 'Meta Business',
    detail: 'Paid social campaign ROI, ad spend, impressions, and conversions.',
    connected: false,
    accountLabel: 'Meta Ad Account ID',
    accountPlaceholder: 'act_1234567890',
    lastSynced: 'Ready to connect',
  },
];

const connectionStorageKey = 'marketing-insights-connections';

export function Integrations() {
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
  const [method, setMethod] = useState<ConnectionMethod>('api');
  const [account, setAccount] = useState('');
  const [credential, setCredential] = useState('');
  const [credentialFile, setCredentialFile] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(isDemoModeActive);

  const configure = (item: Integration) => {
    setOpenIntegration(item.name);
    setMethod(item.method || 'api');
    setAccount(item.account || '');
    setCredential('');
    setCredentialFile('');
    setSavedMessage(null);
  };

  const readCredentialFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          client_email?: string;
          private_key?: string;
          project_id?: string;
        };
        if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
          throw new Error('missing required fields');
        }
        setCredentialFile(file.name);
        setCredential(JSON.stringify(parsed));
        setSavedMessage(`Loaded credentials for service account: ${parsed.client_email}`);
      } catch {
        setCredentialFile('');
        setCredential('');
        setSavedMessage('Invalid file. Please upload a valid Google Service Account JSON key.');
      }
    };
    reader.readAsText(file);
  };

  const saveConnection = (event: React.FormEvent, item: Integration) => {
    event.preventDefault();
    if (!account.trim()) return;

    const nextConnections = connections.map((conn) =>
      conn.name === item.name
        ? {
            ...conn,
            connected: true,
            method,
            account: account.trim(),
            lastSynced: 'Just connected',
          }
        : conn
    );

    setConnections(nextConnections);
    const storagePayload = Object.fromEntries(
      nextConnections
        .filter((c) => c.connected)
        .map((c) => [c.name, { connected: true, method: c.method, account: c.account }])
    );
    localStorage.setItem(connectionStorageKey, JSON.stringify(storagePayload));

    // If GA4 was just connected, prompt user to turn off demo mode if desired
    if (item.name === 'Google Analytics' && isDemo) {
      setDemoModeActive(false);
      setIsDemo(false);
    }

    setSavedMessage(`${item.name} connected successfully!`);
    setTimeout(() => {
      setOpenIntegration(null);
      setSavedMessage(null);
    }, 1500);
  };

  const disconnect = (item: Integration) => {
    const nextConnections = connections.map((conn) =>
      conn.name === item.name ? { ...conn, connected: false, method: undefined, account: undefined } : conn
    );
    setConnections(nextConnections);
    const storagePayload = Object.fromEntries(
      nextConnections
        .filter((c) => c.connected)
        .map((c) => [c.name, { connected: true, method: c.method, account: c.account }])
    );
    localStorage.setItem(connectionStorageKey, JSON.stringify(storagePayload));
    if (openIntegration === item.name) {
      setOpenIntegration(null);
    }
  };

  return (
    <div className="page-content">
      <div className="page-intro">
        <div>
          <p className="eyebrow">Data Pipeline</p>
          <h2>Connected Integrations</h2>
          <p className="muted">
            Connect Google and Meta platforms to unify web performance, search visibility, and paid media.
          </p>
        </div>
      </div>

      <div className="integration-grid">
        {connections.map((item) => (
          <Card key={item.name}>
            <div className="integration-icon">{item.name.slice(0, 2).toUpperCase()}</div>
            <h3>{item.name}</h3>
            <p className="muted">{item.detail}</p>

            <div className="integration-action">
              <Badge tone={item.connected ? 'positive' : 'neutral'}>
                {item.connected
                  ? `Connected (${item.account || (item.method === 'api' ? 'API' : 'OAuth')})`
                  : 'Not Connected'}
              </Badge>
              <Button
                variant={item.connected ? 'ghost' : 'secondary'}
                onClick={() => (item.connected ? disconnect(item) : configure(item))}
              >
                {item.connected ? 'Disconnect' : 'Configure'}
              </Button>
            </div>

            {openIntegration === item.name && (
              <form
                className="integration-form"
                onSubmit={(e) => saveConnection(e, item)}
                style={{ marginTop: '16px', display: 'grid', gap: '12px' }}
              >
                <div className="role-switch">
                  <button
                    type="button"
                    className={method === 'api' ? 'selected' : ''}
                    onClick={() => setMethod('api')}
                  >
                    <strong>API Credentials</strong>
                    <span>Direct property binding</span>
                  </button>
                  <button
                    type="button"
                    className={method === 'oauth' ? 'selected' : ''}
                    onClick={() => setMethod('oauth')}
                  >
                    <strong>OAuth 2.0</strong>
                    <span>Sign in securely</span>
                  </button>
                </div>

                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                  {item.accountLabel}
                  <Input
                    required
                    value={account}
                    placeholder={item.accountPlaceholder}
                    onChange={(e) => setAccount(e.target.value)}
                  />
                </label>

                {item.name === 'Google Analytics' && method === 'api' && (
                  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                    Optional Service Account JSON file
                    <input
                      className="input"
                      type="file"
                      accept=".json,application/json"
                      onChange={readCredentialFile}
                    />
                    <span className="muted" style={{ fontSize: '11px' }}>
                      {credentialFile || 'For Netlify production, configure GOOGLE_SERVICE_ACCOUNT_JSON in environment settings.'}
                    </span>
                  </label>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <Button type="submit">Save & Connect</Button>
                  <Button variant="ghost" type="button" onClick={() => setOpenIntegration(null)}>
                    Cancel
                  </Button>
                </div>

                {savedMessage && <p className="save-note">{savedMessage}</p>}
              </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
