import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const clients = ['Acme Commerce', 'Northwind Health', 'Beacon Financial', 'Orbit Learning'];
export function Clients() { return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">Portfolio</p><h2>Client accounts</h2><p className="muted">Track performance across every active account.</p></div><Button>Add client</Button></div><Card><div className="simple-list">{clients.map((client, index) => <div className="simple-row" key={client}><div className="client-avatar">{client.slice(0, 1)}</div><div><strong>{client}</strong><span>Last synced {index + 1}h ago</span></div><Badge tone={index === 2 ? 'warning' : 'positive'}>{index === 2 ? 'Review' : 'Healthy'}</Badge></div>)}</div></Card></div>; }
