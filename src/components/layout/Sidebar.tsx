import type { Page } from '../../types';

interface SidebarProps { page: Page; onNavigate: (page: Page) => void; }

const items: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Overview', icon: 'OV' },
  { id: 'clients', label: 'Clients', icon: 'CL' },
  { id: 'integrations', label: 'Integrations', icon: 'IN' },
  { id: 'reports', label: 'Reports', icon: 'RP' },
];

export function Sidebar({ page, onNavigate }: SidebarProps) {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">M</span><span>market<span>ing</span> insights</span></div>
    <p className="nav-label">Workspace</p>
    <nav>{items.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
    <div className="sidebar-footer"><p className="nav-label">Current workspace</p><strong>Northstar agency</strong><span>12 active projects</span></div>
  </aside>;
}
