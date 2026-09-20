import { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  getStoredClients,
  saveStoredClients,
  getActiveClientId,
  setActiveClientId,
} from '../utils/clients';
import type { ClientEntity, AuthUser, UserRole } from '../types';

interface ClientsProps {
  user: AuthUser;
  onRoleSwitch?: (role: UserRole) => void;
}

export function Clients({ user, onRoleSwitch }: ClientsProps) {
  const isViewer = user.role === 'viewer';

  const [clients, setClients] = useState<ClientEntity[]>(getStoredClients);
  const [activeId, setActiveId] = useState<string>(getActiveClientId);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'review'>('all');

  // Form state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [message, setMessage] = useState<string | null>(null);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    if (!name.trim()) return;

    const newClient: ClientEntity = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      website: website.trim().startsWith('http') ? website.trim() : `https://${website.trim() || 'example.com'}`,
      role,
      status: 'healthy',
      lastSynced: 'Just now',
      monthlySessions: '14,200',
      monthlyConversions: '380',
    };

    const updated = [newClient, ...clients];
    setClients(updated);
    saveStoredClients(updated);
    setMessage(`Client "${name}" has been added and invitation dispatched to ${email || 'contact'}.`);
    setName('');
    setWebsite('');
    setEmail('');
    setTimeout(() => {
      setShowInvite(false);
      setMessage(null);
    }, 2000);
  };

  const handleRoleChange = (clientId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (isViewer) return;
    const updated = clients.map((c) => (c.id === clientId ? { ...c, role: newRole } : c));
    setClients(updated);
    saveStoredClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    if (isViewer) return;
    if (clients.length <= 1) {
      alert('You must retain at least one client workspace.');
      return;
    }
    const updated = clients.filter((c) => c.id !== clientId);
    setClients(updated);
    saveStoredClients(updated);
    if (activeId === clientId && updated.length > 0) {
      setActiveId(updated[0].id);
      setActiveClientId(updated[0].id);
    }
  };

  const handleSelectWorkspace = (clientId: string) => {
    setActiveId(clientId);
    setActiveClientId(clientId);
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.website.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'healthy'
          ? c.status === 'healthy'
          : c.status !== 'healthy';
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  return (
    <div className="page-content">
      {/* Live Role Switcher Tester */}
      <div
        style={{
          background: '#123c35',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span>Current Session Role:</span>
          <Badge tone={user.role === 'admin' ? 'positive' : 'warning'}>
            {user.role === 'admin' ? 'Workspace Admin' : 'Viewer (Freelancer)'}
          </Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ color: '#91cfb1' }}>Test Role Permissions:</span>
          <button
            type="button"
            className={`badge ${user.role === 'admin' ? 'badge-positive' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 0 }}
            onClick={() => onRoleSwitch?.('admin')}
          >
            Admin (Full Access)
          </button>
          <button
            type="button"
            className={`badge ${user.role === 'viewer' ? 'badge-warning' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 0 }}
            onClick={() => onRoleSwitch?.('viewer')}
          >
            Viewer (Freelancer Restricted)
          </button>
        </div>
      </div>

      <div className="page-intro">
        <div>
          <p className="eyebrow">Client Portfolio</p>
          <h2>Accounts & Workspaces</h2>
          <p className="muted">
            Track performance, permissions, and GA4 property bindings across each account.
          </p>
        </div>
        {!isViewer && (
          <Button onClick={() => setShowInvite((v) => !v)}>
            {showInvite ? 'Close Form' : '+ Add Client Account'}
          </Button>
        )}
      </div>

      {showInvite && !isViewer && (
        <Card className="invite-card" title="Add / Invite New Client">
          <form className="invite-form" onSubmit={handleCreateClient}>
            <Input
              required
              placeholder="Company or Brand Name (e.g. Apex Labs)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Client Name"
            />
            <Input
              type="text"
              placeholder="Website URL (e.g. apexlabs.io)"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              aria-label="Website"
            />
            <Input
              type="email"
              placeholder="Contact Email for Invite"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Client Email"
            />
            <select
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'editor' | 'viewer')}
              aria-label="Access Level"
            >
              <option value="viewer">Viewer — Insights only</option>
              <option value="editor">Editor — Reports & Insights</option>
              <option value="admin">Admin — Full Workspace Access</option>
            </select>
            <Button type="submit">Send Invitation</Button>
          </form>
          {message && <p className="save-note" style={{ marginTop: '12px' }}>{message}</p>}
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px',
          flexWrap: 'wrap',
        }}
      >
        <Input
          placeholder="Search by company or domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '280px' }}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`badge ${statusFilter === 'all' ? 'badge-neutral' : ''}`}
            onClick={() => setStatusFilter('all')}
            style={{ border: 0, cursor: 'pointer', padding: '6px 12px' }}
          >
            All Accounts ({clients.length})
          </button>
          <button
            type="button"
            className={`badge ${statusFilter === 'healthy' ? 'badge-positive' : ''}`}
            onClick={() => setStatusFilter('healthy')}
            style={{ border: 0, cursor: 'pointer', padding: '6px 12px' }}
          >
            Healthy Status
          </button>
          <button
            type="button"
            className={`badge ${statusFilter === 'review' ? 'badge-warning' : ''}`}
            onClick={() => setStatusFilter('review')}
            style={{ border: 0, cursor: 'pointer', padding: '6px 12px' }}
          >
            Needs Review
          </button>
        </div>
      </div>

      <Card>
        <div className="simple-list">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => {
              const isCurrent = client.id === activeId;
              return (
                <div className="simple-row" key={client.id} style={{ alignItems: 'center' }}>
                  <div className="client-avatar">{client.name.slice(0, 1).toUpperCase()}</div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{client.name}</strong>
                      {isCurrent && <Badge tone="positive">Active Context</Badge>}
                    </div>
                    <span>
                      {client.website} • Synced {client.lastSynced} • {client.monthlySessions} sessions / mo
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Badge tone={client.status === 'healthy' ? 'positive' : 'warning'}>
                      {client.status === 'healthy' ? 'Healthy' : 'Needs Review'}
                    </Badge>

                    <select
                      className="permission-select"
                      value={client.role}
                      disabled={isViewer}
                      title={isViewer ? 'Only Admins can change client role permissions' : undefined}
                      onChange={(e) =>
                        handleRoleChange(client.id, e.target.value as 'admin' | 'editor' | 'viewer')
                      }
                      aria-label={`${client.name} permission`}
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        onClick={() => handleSelectWorkspace(client.id)}
                        title="Set this client as active workspace"
                      >
                        Select
                      </Button>
                    )}

                    {!isViewer && (
                      <button
                        type="button"
                        style={{
                          border: 0,
                          background: 'transparent',
                          color: 'var(--coral)',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                        onClick={() => handleDeleteClient(client.id)}
                        title="Remove client"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
              No client accounts matching your filter.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
