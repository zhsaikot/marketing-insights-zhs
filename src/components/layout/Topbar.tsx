import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AuthUser } from '../../types';

export function Topbar({ title, user, onProfile, onLogout }: { title: string; user: AuthUser; onProfile: () => void; onLogout: () => void }) {
  return <header className="topbar"><div><p className="breadcrumb">Workspace / {title}</p><h1>{title}</h1></div><div className="topbar-actions"><Input placeholder="Search insights" aria-label="Search insights" /><Button variant="secondary">Export report</Button><button className="account-menu" onClick={onProfile}><div className="avatar" title="Account">{user.name.slice(0, 2).toUpperCase()}</div><span>{user.name}</span></button><button className="logout-button" onClick={onLogout}>Log out</button></div></header>;
}
