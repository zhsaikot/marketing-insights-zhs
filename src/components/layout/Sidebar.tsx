import type { Page, UserRole } from '../../types';
import { getStoredClients, getActiveClientId } from '../../utils/clients';

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  role: UserRole;
}

const items: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Overview', icon: 'OV' },
  { id: 'clients', label: 'Clients', icon: 'CL' },
  { id: 'integrations', label: 'Integrations', icon: 'IN' },
  { id: 'reports', label: 'Reports', icon: 'RP' },
];

export function Sidebar({ page, onNavigate, role }: SidebarProps) {
  const clients = getStoredClients();
  const activeId = getActiveClientId();
  const activeClient = clients.find((c) => c.id === activeId) || clients[0];

  return (
    <aside className="sidebar">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
        <span className="brand-mark">M</span>
        <span>
          market<span>ing</span> insights
        </span>
      </div>

      <p className="nav-label">Workspace</p>

      <nav>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="nav-label">Active Workspace</p>
        <strong>{activeClient?.name || 'Northstar Agency'}</strong>
        <span style={{ display: 'block', marginTop: '4px' }}>
          Role: <strong style={{ color: role === 'admin' ? '#91cfb1' : '#f7c96a', display: 'inline' }}>
            {role === 'admin' ? 'Workspace Admin' : 'Viewer (Freelancer)'}
          </strong>
        </span>
        <span style={{ fontSize: '11px', color: '#86a69b', marginTop: '4px' }}>
          {clients.length} client accounts
        </span>
      </div>
    </aside>
  );
}
