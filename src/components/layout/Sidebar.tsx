import type { Page, UserRole } from '../../types';

interface SidebarProps { page: Page; onNavigate: (page: Page) => void; role: UserRole; }

const items: { id: Page; label: string; icon: string; agencyOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Overview', icon: 'OV' },
  { id: 'clients', label: 'Clients', icon: 'CL', agencyOnly: true },
  { id: 'integrations', label: 'Integrations', icon: 'IN', agencyOnly: true },
  { id: 'reports', label: 'Reports', icon: 'RP' },
];

export function Sidebar({ page, onNavigate, role }: SidebarProps) {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">M</span><span>market<span>ing</span> insights</span></div>
    <p className="nav-label">Workspace</p>
    <nav>{items.filter((item) => !item.agencyOnly || role === 'agency').map((item) => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
    <div className="sidebar-footer"><p className="nav-label">Current workspace</p><strong>{role === 'agency' ? 'Northstar agency' : 'Acme Commerce'}</strong><span>{role === 'agency' ? '12 active projects' : 'Client access'}</span></div>
  </aside>;
}
