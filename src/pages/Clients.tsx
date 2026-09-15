import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

const clients = ['Acme Commerce', 'Northwind Health', 'Beacon Financial', 'Orbit Learning'];
export function Clients() {
	const [showInvite, setShowInvite] = useState(false);
	const [invited, setInvited] = useState(false);
	return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">Portfolio</p><h2>Client accounts</h2><p className="muted">Track performance, access, and permissions across every account.</p></div><Button onClick={() => setShowInvite((value) => !value)}>{showInvite ? 'Close invite' : 'Invite client'}</Button></div>{showInvite && <Card className="invite-card" title="Invite a client"><form className="invite-form" onSubmit={(event) => { event.preventDefault(); setInvited(true); }}><Input required type="email" placeholder="client@company.com" aria-label="Client email" /><select className="select" defaultValue="viewer" aria-label="Client permission"><option value="viewer">Viewer - reports and insights</option><option value="editor">Editor - reports and insights</option></select><Button type="submit">Send invitation</Button></form>{invited && <p className="save-note">Invitation sent. They will receive a secure sign-in link.</p>}</Card>}<Card><div className="simple-list">{clients.map((client, index) => <div className="simple-row" key={client}><div className="client-avatar">{client.slice(0, 1)}</div><div><strong>{client}</strong><span>Last synced {index + 1}h ago</span></div><Badge tone={index === 2 ? 'warning' : 'positive'}>{index === 2 ? 'Review' : 'Healthy'}</Badge><select className="permission-select" defaultValue={index === 0 ? 'admin' : 'viewer'} aria-label={`${client} permission`}><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></div>)}</div></Card></div>;
}
