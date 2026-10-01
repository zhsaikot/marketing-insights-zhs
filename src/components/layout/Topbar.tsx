import { useState, useEffect } from 'react';
import type { AuthUser } from '../../types';
import { getStoredClients, getActiveClientId, setActiveClientId } from '../../utils/clients';
import { Search, Bell, LogOut } from 'lucide-react';

interface TopbarProps {
  title: string;
  user: AuthUser;
  onProfile: () => void;
  onLogout: () => void;
  onExport?: () => void;
}

export function Topbar({ title, user, onProfile, onLogout }: TopbarProps) {
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

      {/* Right Topbar Actions */}
      <div className="topbar-actions">
        {/* Workspace Switcher Pill */}
        {user.role === 'admin' && clients.length > 0 && (
          <select
            className="pill-select"
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
