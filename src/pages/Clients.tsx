import { useState, useMemo } from 'react';
import {
  getStoredClients,
  saveStoredClients,
  getActiveClientId,
  setActiveClientId,
} from '../utils/clients';
import type { ClientEntity, AuthUser, UserRole } from '../types';
import {
  Building2,
  CheckCircle2,
  Activity,
  Target,
  Search,
  Plus,
  ExternalLink,
  Trash2,
  X,
  Sparkles,
  Check,
  ShieldAlert,
  Pencil,
  Upload,
} from 'lucide-react';

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

  // Edit Client Modal state
  const [editingClient, setEditingClient] = useState<ClientEntity | null>(null);
  const [editName, setEditName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editPropertyId, setEditPropertyId] = useState('');
  const [editLogo, setEditLogo] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'healthy' | 'review' | 'attention'>('healthy');
  const [editRole, setEditRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [editSessions, setEditSessions] = useState('');
  const [editConversions, setEditConversions] = useState('');
  const [editMessage, setEditMessage] = useState<string | null>(null);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    if (!name.trim()) return;

    const newClient: ClientEntity = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      website: website.trim().startsWith('http')
        ? website.trim()
        : `https://${website.trim() || 'example.com'}`,
      role,
      status: 'healthy',
      lastSynced: 'Just now',
      monthlySessions: '14,200',
      monthlyConversions: '380',
    };

    const updated = [newClient, ...clients];
    setClients(updated);
    saveStoredClients(updated);
    setMessage(`Client "${name}" has been added successfully.`);
    setName('');
    setWebsite('');
    setEmail('');
    setTimeout(() => {
      setShowInvite(false);
      setMessage(null);
    }, 1200);
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

  const handleOpenEdit = (client: ClientEntity) => {
    if (isViewer) return;
    setEditingClient(client);
    setEditName(client.name);
    setEditWebsite(client.website);
    setEditPropertyId(client.propertyId || '');
    setEditLogo(client.logo || '');
    setEditStatus(client.status);
    setEditRole(client.role);
    setEditSessions(client.monthlySessions);
    setEditConversions(client.monthlyConversions);
    setEditMessage(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setEditLogo(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || !editingClient || !editName.trim()) return;

    const rawWebsite = editWebsite.trim();
    const formattedWebsite = rawWebsite
      ? rawWebsite.startsWith('http://') || rawWebsite.startsWith('https://')
        ? rawWebsite
        : `https://${rawWebsite}`
      : 'https://example.com';

    const updated = clients.map((c) => {
      if (c.id === editingClient.id) {
        return {
          ...c,
          name: editName.trim(),
          website: formattedWebsite,
          propertyId: editPropertyId.trim() || undefined,
          logo: editLogo.trim() || undefined,
          status: editStatus,
          role: editRole,
          monthlySessions: editSessions.trim() || c.monthlySessions,
          monthlyConversions: editConversions.trim() || c.monthlyConversions,
          lastSynced: 'Just now',
        };
      }
      return c;
    });

    setClients(updated);
    saveStoredClients(updated);
    setEditMessage(`Client "${editName.trim()}" updated successfully!`);

    setTimeout(() => {
      setEditingClient(null);
      setEditMessage(null);
    }, 800);
  };

  const handleSelectWorkspace = (clientId: string) => {
    setActiveId(clientId);
    setActiveClientId(clientId);
    window.location.reload();
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

  // Aggregate stats
  const totalSessions = clients.reduce((acc, c) => {
    const val = parseInt(c.monthlySessions.replace(/[^0-9]/g, ''), 10) || 0;
    return acc + val;
  }, 0);

  const totalConversions = clients.reduce((acc, c) => {
    const val = parseInt(c.monthlyConversions.replace(/[^0-9]/g, ''), 10) || 0;
    return acc + val;
  }, 0);

  return (
    <div className="page-content">
      {/* Top Page Intro Header (Sociafy Style) */}
      <div className="page-intro">
        <div>
          <h2>Client Accounts & Workspaces</h2>
          <p className="muted">
            Manage multi-brand workspaces, role-based access permissions, and analytics properties.
          </p>
        </div>

        {!isViewer && (
          <button
            type="button"
            className="button button-primary"
            onClick={() => setShowInvite(true)}
          >
            <Plus size={16} />
            <span>Add Client Account</span>
          </button>
        )}
      </div>

      {/* Live Role Switcher Pill Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--white)',
          padding: '10px 20px',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '22px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <strong style={{ color: 'var(--ink)' }}>Current Session:</strong>
          <span className={`badge ${user.role === 'admin' ? 'badge-positive' : 'badge-warning'}`}>
            {user.role === 'admin' ? 'Workspace Admin (Full Control)' : 'Viewer (Freelancer Read-Only)'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Test Role Permissions:</span>
          <button
            type="button"
            className={`badge ${user.role === 'admin' ? 'badge-positive' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 0, padding: '6px 12px' }}
            onClick={() => onRoleSwitch?.('admin')}
          >
            Admin (Full Access)
          </button>
          <button
            type="button"
            className={`badge ${user.role === 'viewer' ? 'badge-warning' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 0, padding: '6px 12px' }}
            onClick={() => onRoleSwitch?.('viewer')}
          >
            Viewer (Read-Only)
          </button>
        </div>
      </div>

      {/* 4 Sociafy-Style KPI Cards for Clients Suite */}
      <div className="clients-kpi-grid">
        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Client Workspaces</h4>
            <div className="sociafy-metric-badge purple">
              <Building2 size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">{clients.length}</span>
              <span className="sociafy-pill-trend up">
                <CheckCircle2 size={12} /> Active
              </span>
            </div>
            <span className="sociafy-metric-sub">Dedicated brand environments</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Pipeline Health</h4>
            <div className="sociafy-metric-badge green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">100%</span>
              <span className="sociafy-pill-trend up">Healthy</span>
            </div>
            <span className="sociafy-metric-sub">API tokens active & synced</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Monthly Sessions</h4>
            <div className="sociafy-metric-badge blue">
              <Activity size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">
                {totalSessions.toLocaleString('en-US')}
              </span>
              <span className="sociafy-pill-trend up">+18.4%</span>
            </div>
            <span className="sociafy-metric-sub">Aggregated traffic across accounts</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Total Conversions</h4>
            <div className="sociafy-metric-badge pink">
              <Target size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value">
                {totalConversions.toLocaleString('en-US')}
              </span>
              <span className="sociafy-pill-trend up">+14.2%</span>
            </div>
            <span className="sociafy-metric-sub">Aggregated client conversions</span>
          </div>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="clients-toolbar">
        {/* Search input with icon */}
        <div className="reports-search-box">
          <Search />
          <input
            type="text"
            className="reports-search-input"
            placeholder="Search by company or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="pill-segmented-control">
          <button
            type="button"
            className={`pill-segmented-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Accounts ({clients.length})
          </button>
          <button
            type="button"
            className={`pill-segmented-btn ${statusFilter === 'healthy' ? 'active' : ''}`}
            onClick={() => setStatusFilter('healthy')}
          >
            Healthy Status
          </button>
          <button
            type="button"
            className={`pill-segmented-btn ${statusFilter === 'review' ? 'active' : ''}`}
            onClick={() => setStatusFilter('review')}
          >
            Needs Review
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--white)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Building2 size={40} color="var(--muted-light)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', color: 'var(--ink)' }}>No Client Accounts Found</h3>
          <p className="muted" style={{ margin: 0 }}>
            {search
              ? `No clients matched your search query "${search}".`
              : 'Click "+ Add Client Account" to create your first client workspace.'}
          </p>
        </div>
      )}

      {/* Modern Sociafy-Inspired Client Cards Grid */}
      <div className="reports-card-grid">
        {filteredClients.map((client, idx) => {
          const isCurrent = client.id === activeId;
          const gradientClass = `gradient-${(idx % 4) + 1}`;

          return (
            <div
              key={client.id}
              className={`client-item-card ${isCurrent ? 'active-workspace' : ''}`}
            >
              <div>
                {/* Card Top: Avatar + Title + Status */}
                <div className="client-item-top">
                  <div
                    className={`client-item-avatar ${gradientClass}`}
                    style={{
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: client.logo ? '#ffffff' : undefined,
                      border: client.logo ? '1px solid var(--line)' : undefined,
                      padding: client.logo ? '3px' : 0,
                    }}
                  >
                    {client.logo ? (
                      <img
                        src={client.logo}
                        alt={`${client.name} logo`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: 'inherit',
                        }}
                      />
                    ) : (
                      client.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="client-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 className="client-item-title">{client.name}</h3>
                      {isCurrent && (
                        <span className="badge badge-positive" style={{ fontSize: '10px' }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="client-item-link"
                      >
                        <span>{client.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink size={12} />
                      </a>
                      {client.propertyId && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--muted)',
                            background: 'rgba(15, 23, 42, 0.05)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                          }}
                          title={`GA4 Property ID: ${client.propertyId}`}
                        >
                          GA4: {client.propertyId}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      client.status === 'healthy'
                        ? 'badge-positive'
                        : client.status === 'attention'
                        ? 'badge-critical'
                        : 'badge-warning'
                    }`}
                    style={{ fontSize: '10px' }}
                  >
                    {client.status === 'healthy'
                      ? '● Healthy'
                      : client.status === 'attention'
                      ? '● Action Required'
                      : '● Needs Review'}
                  </span>
                </div>

                {/* 3-Column Mini KPI Metrics Box */}
                <div className="client-metrics-box">
                  <div className="client-metric-stat">
                    <strong>{client.monthlySessions}</strong>
                    <span>Sessions / Mo</span>
                  </div>
                  <div className="client-metric-stat">
                    <strong>{client.monthlyConversions}</strong>
                    <span>Conversions</span>
                  </div>
                  <div className="client-metric-stat">
                    <strong style={{ color: 'var(--green)' }}>{client.lastSynced}</strong>
                    <span>Token Sync</span>
                  </div>
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="report-item-actions">
                <div className="report-action-group">
                  {/* Role Permission Dropdown */}
                  <select
                    className="pill-select"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    value={client.role}
                    disabled={isViewer}
                    title={isViewer ? 'Only Admins can change client role permissions' : undefined}
                    onChange={(e) =>
                      handleRoleChange(client.id, e.target.value as 'admin' | 'editor' | 'viewer')
                    }
                    aria-label={`${client.name} permission`}
                  >
                    <option value="admin">Role: Admin</option>
                    <option value="editor">Role: Editor</option>
                    <option value="viewer">Role: Viewer</option>
                  </select>

                  {/* Switch Workspace Button */}
                  {!isCurrent ? (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => handleSelectWorkspace(client.id)}
                    >
                      Switch To
                    </button>
                  ) : (
                    <span
                      className="badge badge-positive"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <Check size={13} style={{ marginRight: '4px' }} /> Selected
                    </span>
                  )}
                </div>

                {!isViewer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="icon-circle-btn"
                      style={{ width: '34px', height: '34px', color: 'var(--brand)' }}
                      onClick={() => handleOpenEdit(client)}
                      title={`Edit ${client.name} details`}
                      aria-label={`Edit ${client.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-circle-btn"
                      style={{ width: '34px', height: '34px', color: 'var(--coral)' }}
                      onClick={() => handleDeleteClient(client.id)}
                      title="Delete client account"
                      aria-label="Delete client"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Client Modern Modal Dialog */}
      {showInvite && !isViewer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowInvite(false)}
        >
          <div
            className="card"
            style={{
              width: 'min(100%, 520px)',
              padding: '30px',
              borderRadius: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="sociafy-metric-badge purple" style={{ width: '36px', height: '36px' }}>
                  <Sparkles size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                  Add Client Workspace
                </h3>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setShowInvite(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                  Brand or Company Name
                </label>
                <input
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Apex Digital Commerce"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                  Website Property URL
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. apexcommerce.io"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="marketing@apex.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                    Initial Access Level
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                  >
                    <option value="viewer">Viewer (Read-Only)</option>
                    <option value="editor">Editor (Reports & Data)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>
              </div>

              {message && (
                <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: '10px', color: 'var(--green)', fontSize: '12px', fontWeight: 600 }}>
                  ✓ {message}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowInvite(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modern Modal Dialog */}
      {editingClient && !isViewer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setEditingClient(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(100%, 540px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              borderRadius: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  className="sociafy-metric-badge green"
                  style={{ width: '38px', height: '38px' }}
                >
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                    Edit Client Workspace
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                    Modify client domain, property ID, targets & access
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setEditingClient(null)}
                aria-label="Close edit modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'grid', gap: '15px' }}>
              {/* Brand Logo Upload & Preview Section */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: 'var(--ink)',
                  }}
                >
                  Brand Avatar / Logo
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 16px',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px dashed var(--line)',
                  }}
                >
                  {/* Live Avatar / Logo Preview */}
                  <div
                    style={{
                      width: '58px',
                      height: '58px',
                      borderRadius: '14px',
                      background: editLogo ? '#ffffff' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: editLogo ? '1px solid var(--line)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      padding: editLogo ? '4px' : 0,
                    }}
                  >
                    {editLogo ? (
                      <img
                        src={editLogo}
                        alt="Brand Logo preview"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: 700 }}>
                        {editName ? editName.slice(0, 1).toUpperCase() : 'C'}
                      </span>
                    )}
                  </div>

                  {/* Actions & File Picker */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label
                        className="button button-secondary"
                        style={{
                          cursor: 'pointer',
                          padding: '6px 14px',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          margin: 0,
                          fontWeight: 600,
                        }}
                      >
                        <Upload size={14} />
                        Upload Logo
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
                          style={{ display: 'none' }}
                          onChange={handleLogoUpload}
                        />
                      </label>

                      {editLogo && (
                        <button
                          type="button"
                          className="button"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: 'var(--coral)',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() => setEditLogo('')}
                          title="Remove custom logo"
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <input
                        className="input"
                        style={{ width: '100%', fontSize: '11px', padding: '6px 10px' }}
                        placeholder="Or paste image URL (e.g. https://.../logo.png)"
                        value={editLogo.startsWith('data:') ? '' : editLogo}
                        onChange={(e) => setEditLogo(e.target.value)}
                      />
                    </div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        color: 'var(--muted)',
                        marginTop: '4px',
                      }}
                    >
                      Supports PNG, JPG, WebP, SVG (Max 2MB).
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: 'var(--ink)',
                  }}
                >
                  Brand or Company Name *
                </label>
                <input
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Apex Digital Commerce"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '4px',
                    color: 'var(--ink)',
                  }}
                >
                  Website Property URL *
                </label>
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: 'var(--muted)',
                    marginBottom: '6px',
                  }}
                >
                  Used directly for live Google PageSpeed audits and domain monitoring
                </span>
                <input
                  required
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="https://example.com"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: 'var(--ink)',
                    }}
                  >
                    GA4 Property ID
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 384920184"
                    value={editPropertyId}
                    onChange={(e) => setEditPropertyId(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: 'var(--ink)',
                    }}
                  >
                    Access Role Level
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="editor">Editor (Reports & Data)</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: 'var(--ink)',
                  }}
                >
                  Workspace Status
                </label>
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as 'healthy' | 'review' | 'attention')
                  }
                >
                  <option value="healthy">● Healthy (Active Data Sync)</option>
                  <option value="review">● Needs Review (Warning)</option>
                  <option value="attention">● Action Required (Critical)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: 'var(--ink)',
                    }}
                  >
                    Monthly Sessions Goal
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 142,500"
                    value={editSessions}
                    onChange={(e) => setEditSessions(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                      color: 'var(--ink)',
                    }}
                  >
                    Monthly Conversions Goal
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 4,890"
                    value={editConversions}
                    onChange={(e) => setEditConversions(e.target.value)}
                  />
                </div>
              </div>

              {editMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#ecfdf5',
                    borderRadius: '10px',
                    color: 'var(--green)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  ✓ {editMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setEditingClient(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
