import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const integrations = [{ name: 'Google Analytics', detail: 'Traffic and conversion data', status: 'Connected' }, { name: 'Google Search Console', detail: 'Search visibility and queries', status: 'Connected' }, { name: 'Meta Ads', detail: 'Paid social performance', status: 'Connect' }];
export function Integrations() { return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">Data sources</p><h2>Integrations</h2><p className="muted">Connect the tools that power your reporting.</p></div></div><div className="integration-grid">{integrations.map((item) => <Card key={item.name}><div className="integration-icon">{item.name.slice(0, 2).toUpperCase()}</div><h3>{item.name}</h3><p className="muted">{item.detail}</p><Badge tone={item.status === 'Connected' ? 'positive' : 'neutral'}>{item.status}</Badge></Card>)}</div></div>; }
