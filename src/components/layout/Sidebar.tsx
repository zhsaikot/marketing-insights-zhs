import type { Page, UserRole } from '../../types';
import { getStoredClients, getActiveClientId } from '../../utils/clients';
import {
  LayoutDashboard,
  Gauge,
  Users,
  Plug,
  FileBarChart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  role: UserRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
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

export function Sidebar({
  page,
  onNavigate,
  role,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const clients = getStoredClients();
  const activeId = getActiveClientId();
  const activeClient = clients.find((c) => c.id === activeId) || clients[0];

  return (
    <aside
      className={`sidebar ${collapsed ? 'is-collapsed' : 'is-expanded'} ${
        mobileOpen ? 'mobile-drawer-open' : ''
      }`}
      aria-label="Main sidebar navigation"
    >
      {/* Brand Header & Collapse Toggle */}
      <div className="brand-container">
        <div
          className="brand"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('dashboard')}
          title={collapsed ? 'Marketing Insights Dashboard' : undefined}
        >
          <span className="brand-mark">M</span>
          {!collapsed && (
            <div className="brand-text">
              Marketing<span>Insights</span>
            </div>
          )}
        </div>

        {/* Desktop Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            title="Close navigation"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Menu Section */}
      <div className="nav-section">
        {!collapsed && <p className="nav-label">Main Menu</p>}
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
                title={item.label}
              >
                <Icon className="nav-icon-svg" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Workspace / General Section */}
      <div className="nav-section">
        {!collapsed && <p className="nav-label">Workspace</p>}
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
                title={item.label}
              >
                <Icon className="nav-icon-svg" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Lower Promo / Workspace Status Card */}
      {!collapsed ? (
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
      ) : (
        <div
          className="sidebar-promo-collapsed"
          onClick={() => onNavigate('clients')}
          title={`${activeClient?.name || 'Workspace'} • ${clients.length} active client${clients.length === 1 ? '' : 's'}`}
          role="button"
          tabIndex={0}
        >
          <Sparkles size={18} color="var(--brand-green)" />
        </div>
      )}
    </aside>
  );
}
