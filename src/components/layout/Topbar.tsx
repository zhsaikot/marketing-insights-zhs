import { useState, useEffect } from 'react';
import type { AuthUser } from '../../types';
import { getStoredClients, getActiveClientId, setActiveClientId } from '../../utils/clients';
import { Search, Bell, LogOut, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

interface TopbarProps {
  title: string;
  user: AuthUser;
  onProfile: () => void;
  onLogout: () => void;
  onExport?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Topbar({
  title,
  user,
  onProfile,
  onLogout,
  onToggleSidebar,
  isSidebarCollapsed = false,
}: TopbarProps) {
  const [clients, setClients] = useState(getStoredClients);
  const [activeId, setActiveId] = useState(getActiveClientId);

  useEffect(() => {
    setClients(getStoredClients());
    setActiveId(getActiveClientId());
  }, [title]);

  const handleClientChange = (newId: string) => {
    setActiveId(newId);
    setActiveClientId(newId);
    window.location.reload();
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            type="button"
            className="icon-circle-btn sidebar-hamburger-btn"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label="Toggle navigation sidebar"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}

        {/* Search Pill Input with Shortcut (Sociafy Style) */}
        <div className="search-pill-wrapper">
          <Search className="search-pill-icon" />
          <input
            type="text"
            className="search-pill-input"
            placeholder="Search metrics, clients, reports..."
            aria-label="Global search"
          />
          <span className="search-pill-shortcut">⌘F</span>
        </div>
      </div>

      {/* Right Topbar Actions */}
      <div className="topbar-actions">
        {/* Workspace Switcher Pill */}
        {user.role === 'admin' && clients.length > 0 && (
          <select
            className="pill-select topbar-client-select"
            value={activeId}
            onChange={(e) => handleClientChange(e.target.value)}
            aria-label="Active Client Workspace"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                🏢 {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Quick Notification Icon Button */}
        <button
          type="button"
          className="icon-circle-btn"
          title="Notifications & Alerts"
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>

        {/* Dark / Light Mode Toggle Button */}
        <ThemeToggle />

        {/* User Account Profile Pill (Sociafy Style) */}
        <div
          className="account-profile-pill"
          onClick={onProfile}
          title="View profile & account settings"
          role="button"
          tabIndex={0}
        >
          <div className="avatar" style={{ overflow: 'hidden' }}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              user.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="account-info">
            <span className="account-name">{user.name}</span>
            <span className="account-role">
              {user.role === 'admin' ? 'Workspace Admin' : 'Client Viewer'}
            </span>
          </div>
        </div>

        {/* Logout Quick Button */}
        <button
          type="button"
          className="icon-circle-btn"
          onClick={onLogout}
          title="Sign out of platform"
          aria-label="Log out"
          style={{ color: 'var(--coral)' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
