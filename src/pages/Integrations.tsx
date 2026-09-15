import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const integrations = [{ name: 'Google Analytics', detail: 'Traffic and conversion data', connected: true }, { name: 'Google Search Console', detail: 'Search visibility and queries', connected: true }, { name: 'Meta Ads', detail: 'Paid social performance', connected: false }];
export function Integrations() {
	const [connections, setConnections] = useState(integrations);
	return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">Data sources</p><h2>Integrations</h2><p className="muted">Connect the tools that power your reporting.</p></div></div><div className="integration-grid">{connections.map((item) => <Card key={item.name}><div className="integration-icon">{item.name.slice(0, 2).toUpperCase()}</div><h3>{item.name}</h3><p className="muted">{item.detail}</p><div className="integration-action"><Badge tone={item.connected ? 'positive' : 'neutral'}>{item.connected ? 'Connected' : 'Not connected'}</Badge><Button variant={item.connected ? 'ghost' : 'secondary'} onClick={() => setConnections((current) => current.map((connection) => connection.name === item.name ? { ...connection, connected: !connection.connected } : connection))}>{item.connected ? 'Disconnect' : 'Connect'}</Button></div></Card>)}</div></div>;
}
