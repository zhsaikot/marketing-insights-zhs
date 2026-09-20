import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AuthUser } from '../../types';
import { getStoredClients, getActiveClientId, setActiveClientId } from '../../utils/clients';

interface TopbarProps {
  title: string;
  user: AuthUser;
  onProfile: () => void;
  onLogout: () => void;
  onExport?: () => void;
}

export function Topbar({ title, user, onProfile, onLogout, onExport }: TopbarProps) {
  const [clients, setClients] = useState(getStoredClients);
  const [activeId, setActiveId] = useState(getActiveClientId);

  useEffect(() => {
    // Refresh client list if changed
    setClients(getStoredClients());
    setActiveId(getActiveClientId());
  }, [title]);

  const handleClientChange = (newId: string) => {
    setActiveId(newId);
    setActiveClientId(newId);
    window.location.reload(); // Refresh to re-scope metrics cleanly
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      window.print();
    }
  };

  const activeClient = clients.find((c) => c.id === activeId) || clients[0];

  return (
    <header className="topbar">
      <div>
        <p className="breadcrumb">Workspace / {title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1>{title}</h1>
          {user.role === 'admin' && clients.length > 0 && (
            <select
              className="select"
              value={activeId}
              onChange={(e) => handleClientChange(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                background: '#eef5f1',
                borderColor: 'var(--line)',
                fontWeight: 600,
              }}
              aria-label="Active Client Workspace"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  Client: {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="topbar-actions">
        <Input placeholder="Search metrics or queries..." aria-label="Search insights" />
        <Button variant="secondary" onClick={handleExport} title="Print or save PDF view">
          Export / Print
        </Button>
        <button className="account-menu" onClick={onProfile}>
          <div className="avatar" title="Account Settings">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <span>{user.name}</span>
        </button>
        <button className="logout-button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
