import type { Page, UserRole } from '../../types';
import { getStoredClients, getActiveClientId } from '../../utils/clients';
import {
  LayoutDashboard,
  Gauge,
  Users,
  Plug,
  FileBarChart,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  role: UserRole;
}

const mainMenu: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
];

const workspaceMenu: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'clients', label: 'Clients', icon: Users },
];

export function Sidebar({ page, onNavigate, role }: SidebarProps) {
  const clients = getStoredClients();
  const activeId = getActiveClientId();
  const activeClient = clients.find((c) => c.id === activeId) || clients[0];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand" style={{ cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
        <span className="brand-mark">M</span>
        <div className="brand-text">
          Marketing<span>Insights</span>
        </div>
      </div>

      {/* Main Menu Section */}
      <div className="nav-section">
        <p className="nav-label">Main Menu</p>
        <nav>
          {mainMenu.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="nav-icon-svg" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Workspace / General Section */}
      <div className="nav-section">
        <p className="nav-label">Workspace</p>
        <nav>
          {workspaceMenu.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="nav-icon-svg" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sociafy Inspired Lower Promo / Workspace Status Card */}
      <div className="sidebar-promo-card">
        <div className="sidebar-promo-badge">
          <Sparkles size={20} />
        </div>
        <h4 className="sidebar-promo-title">{activeClient?.name || 'Northstar Agency'}</h4>
        <p className="sidebar-promo-text">
          {role === 'admin' ? 'Full Workspace Admin Access' : 'Read-Only Viewer Access'} • {clients.length} active client{clients.length === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          className="sidebar-promo-btn"
          onClick={() => onNavigate('clients')}
        >
          Manage Workspaces
        </button>
      </div>
    </aside>
  );
}
