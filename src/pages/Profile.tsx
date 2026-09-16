import { useState } from 'react';
import type { AuthUser } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function Profile({ user, onSave, onVerify }: { user: AuthUser; onSave: (updates: Pick<AuthUser, 'name' | 'company'>) => void; onVerify: () => void }) {
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company);
  const [saved, setSaved] = useState(false);
  const save = (event: React.FormEvent) => { event.preventDefault(); onSave({ name, company }); setSaved(true); };
  return <div className="page-content"><div className="page-intro"><div><p className="eyebrow">Account</p><h2>Your profile</h2><p className="muted">Manage your personal details and account security.</p></div></div><div className="profile-grid"><Card title="Personal details"><form className="profile-form" onSubmit={save}><label>Full name<Input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Email address<Input value={user.email} disabled /></label><label>{user.role === 'agency' ? 'Agency name' : 'Company name'}<Input value={company} onChange={(event) => setCompany(event.target.value)} /></label><div className="profile-actions"><Button type="submit">Save changes</Button>{saved && <span className="save-note">Changes saved</span>}</div></form></Card><Card title="Account access"><div className="access-row"><span>Account type</span><Badge tone="neutral">{user.role === 'agency' ? 'Marketing Expert' : 'Owner'}</Badge></div><div className="access-row"><span>Email verification</span>{user.verified ? <Badge tone="positive">Verified</Badge> : <button className="text-button" onClick={onVerify}>Verify now</button>}</div><div className="access-row"><span>Password</span><button className="text-button">Change password</button></div></Card></div></div>;
}
