import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type ConnectionMethod = 'oauth' | 'api';
type Integration = { name: string; detail: string; connected: boolean; method?: ConnectionMethod; account?: string; accountLabel: string; accountPlaceholder: string };

const integrations: Integration[] = [
	{ name: 'Google Analytics', detail: 'Traffic and conversion data', connected: false, accountLabel: 'GA4 property ID', accountPlaceholder: '例如 123456789' },
	{ name: 'Google Search Console', detail: 'Search visibility and queries', connected: false, accountLabel: 'Website property', accountPlaceholder: 'https://example.com' },
	{ name: 'Meta Business', detail: 'Paid social performance', connected: false, accountLabel: 'Ad account ID', accountPlaceholder: 'act_123456789' },
];

const connectionStorageKey = 'marketing-insights-connections';

export function Integrations() {
	const [connections, setConnections] = useState<Integration[]>(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(connectionStorageKey) || '{}') as Record<string, Partial<Integration>>;
			return integrations.map((integration) => ({ ...integration, ...saved[integration.name] }));
		} catch {
			return integrations;
		}
	});
	const [openIntegration, setOpenIntegration] = useState<string | null>(null);
	const [method, setMethod] = useState<ConnectionMethod>('oauth');
	const [account, setAccount] = useState('');
	const [credential, setCredential] = useState('');
	const [credentialFile, setCredentialFile] = useState('');
	const [savedMessage, setSavedMessage] = useState<string | null>(null);

	const configure = (item: Integration) => {
		setOpenIntegration(item.name);
		setMethod(item.method || 'oauth');
		setAccount('');
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
				const parsed = JSON.parse(String(reader.result)) as { client_email?: string; private_key?: string; project_id?: string };
				if (!parsed.client_email || !parsed.private_key || !parsed.project_id) throw new Error('missing required fields');
				setCredentialFile(file.name);
				setCredential(JSON.stringify(parsed));
				setSavedMessage('JSON credentials loaded for this setup request.');
			} catch {
				setCredentialFile('');
				setCredential('');
				setSavedMessage('That file is not a valid Google service-account JSON file.');
			}
		};
		reader.readAsText(file);
	};

	const saveConnection = (event: React.FormEvent, item: Integration) => {
		event.preventDefault();
		if (!account.trim() || !credential.trim()) return;
		const nextConnections = connections.map((connection) => connection.name === item.name ? { ...connection, connected: true, method, account: account.trim() } : connection);
		setConnections(nextConnections);
		localStorage.setItem(connectionStorageKey, JSON.stringify(Object.fromEntries(nextConnections.filter((connection) => connection.connected).map((connection) => [connection.name, { connected: true, method: connection.method, account: connection.account }]))));
		setCredential('');
		setSavedMessage(`${item.name} connection details saved. Secure authorization will run when the API service is configured.`);
	};

	const disconnect = (item: Integration) => {
		const nextConnections = connections.map((connection) => connection.name === item.name ? { ...connection, connected: false, method: undefined } : connection);
		setConnections(nextConnections);
		localStorage.setItem(connectionStorageKey, JSON.stringify(Object.fromEntries(nextConnections.filter((connection) => connection.connected).map((connection) => [connection.name, { connected: true, method: connection.method }]))));
		setOpenIntegration(null);
	};

	return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">Data sources</p><h2>Integrations</h2><p className="muted">Connect Google and Meta data sources for detailed reporting.</p></div></div><div className="integration-grid">{connections.map((item) => <Card key={item.name}><div className="integration-icon">{item.name.slice(0, 2).toUpperCase()}</div><h3>{item.name}</h3><p className="muted">{item.detail}</p><div className="integration-action"><Badge tone={item.connected ? 'positive' : 'neutral'}>{item.connected ? `Connected via ${item.method === 'api' ? 'API' : 'OAuth'}` : 'Not connected'}</Badge><Button variant={item.connected ? 'ghost' : 'secondary'} onClick={() => item.connected ? disconnect(item) : configure(item)}>{item.connected ? 'Disconnect' : 'Configure'}</Button></div>{openIntegration === item.name && <form className="integration-form" onSubmit={(event) => saveConnection(event, item)}><div className="role-switch"><button type="button" className={method === 'oauth' ? 'selected' : ''} onClick={() => setMethod('oauth')}><strong>OAuth</strong><span>Sign in securely</span></button><button type="button" className={method === 'api' ? 'selected' : ''} onClick={() => setMethod('api')}><strong>API credentials</strong><span>Use a token or key</span></button></div><label>{item.accountLabel}<Input required value={account} placeholder={item.accountPlaceholder} onChange={(event) => setAccount(event.target.value)} /></label>{item.name === 'Google Analytics' && method === 'api' && <label>Google service-account JSON<input className="input" required type="file" accept=".json,application/json" onChange={readCredentialFile} /><span className="muted integration-security-note">{credentialFile || 'Choose the JSON key downloaded from Google Cloud.'}</span></label>}<label>{item.name === 'Google Analytics' && method === 'api' ? 'API credential' : method === 'oauth' ? 'OAuth client ID or authorization code' : 'API key or access token'}<Input required type="password" value={credential} placeholder={item.name === 'Google Analytics' && method === 'api' ? 'Loaded from the JSON file above' : method === 'oauth' ? 'Paste the value from your provider' : 'Paste a secure credential'} onChange={(event) => setCredential(event.target.value)} /></label><p className="muted integration-security-note">Credentials are used only for this setup request and are not saved in browser storage. For dashboard refreshes, configure GOOGLE_SERVICE_ACCOUNT_JSON in Netlify.</p><Button type="submit">Save connection</Button>{savedMessage && <p className="save-note">{savedMessage}</p>}</form>}</Card>)}</div></div>;
}
