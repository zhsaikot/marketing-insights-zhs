import { useState, useRef } from 'react';
import type { AuthUser } from '../types';
import {
  User,
  Camera,
  Trash2,
  ShieldCheck,
  Mail,
  Building2,
  Key,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';

export function Profile({
  user,
  onSave,
  onVerify,
}: {
  user: AuthUser;
  onSave: (updates: Partial<AuthUser>) => void;
  onVerify: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company);
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        onSave({ name, company, avatar: base64String });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(undefined);
    onSave({ name, company, avatar: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ name, company, avatar });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const roleLabel =
    user.role === 'admin'
      ? 'Workspace Administrator'
      : user.role === 'editor'
      ? 'Campaign Editor'
      : 'Client / Freelancer Viewer';

  return (
    <div className="page-content">
      {/* Top Page Intro Header (Sociafy Style) */}
      <div className="page-intro">
        <div>
          <h2>Account & Profile Settings</h2>
          <p className="muted">
            Manage your personal profile, customize your avatar, and review workspace access permissions.
          </p>
        </div>
      </div>

      {/* 4 Sociafy-Style KPI Cards for Profile Suite */}
      <div className="clients-kpi-grid">
        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Access Level</h4>
            <div className="sociafy-metric-badge green">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value" style={{ fontSize: '22px' }}>
                {user.role === 'admin' ? 'Admin' : 'Viewer'}
              </span>
              <span className="sociafy-pill-trend up">
                <CheckCircle2 size={12} /> Full Auth
              </span>
            </div>
            <span className="sociafy-metric-sub">{roleLabel}</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Email Status</h4>
            <div className="sociafy-metric-badge purple">
              <Mail size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value" style={{ fontSize: '22px' }}>
                {user.verified ? 'Verified' : 'Pending'}
              </span>
              <span className={`sociafy-pill-trend ${user.verified ? 'up' : 'down'}`}>
                {user.verified ? '100%' : 'Action'}
              </span>
            </div>
            <span className="sociafy-metric-sub">{user.email}</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Agency Workspace</h4>
            <div className="sociafy-metric-badge blue">
              <Building2 size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value" style={{ fontSize: '20px' }}>
                {company || 'Primary'}
              </span>
            </div>
            <span className="sociafy-metric-sub">Dedicated tenant environment</span>
          </div>
        </div>

        <div className="sociafy-metric-card">
          <div className="sociafy-metric-top">
            <h4 className="sociafy-metric-label">Security Engine</h4>
            <div className="sociafy-metric-badge pink">
              <Lock size={18} />
            </div>
          </div>
          <div className="sociafy-metric-bottom">
            <div className="sociafy-metric-row">
              <span className="sociafy-metric-value" style={{ fontSize: '22px' }}>
                Encrypted
              </span>
              <span className="sociafy-pill-trend up">Local Vault</span>
            </div>
            <span className="sociafy-metric-sub">Token storage isolation</span>
          </div>
        </div>
      </div>

      {/* Main Profile Grid: Avatar Banner + Details + Security */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)', gap: '20px' }}>
        {/* Left Column: Profile Avatar Upload & Personal Details Form */}
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Avatar Upload Card */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              {/* Circular Avatar Container */}
              <div
                style={{
                  position: 'relative',
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #0d7656 100%)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: 800,
                  boxShadow: 'var(--shadow-pill)',
                  border: '4px solid #ffffff',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{user.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              {/* Upload Controls & Details */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                  Profile Photo
                </h3>
                <p className="muted" style={{ margin: '0 0 14px', fontSize: '12px' }}>
                  Upload a personal picture (JPG, PNG, GIF up to 2MB). It will appear across the dashboard topbar and client reports.
                </p>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="button button-primary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={14} />
                    <span>Upload New Photo</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ padding: '8px 14px', fontSize: '12px', color: 'var(--coral)' }}
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details Form Card */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div className="sociafy-metric-badge green" style={{ width: '36px', height: '36px' }}>
                <User size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Personal Information</h3>
                <span className="muted" style={{ fontSize: '12px' }}>Update your user display name and workspace metadata</span>
              </div>
            </div>

            <form onSubmit={save} style={{ display: 'grid', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                  Full Name
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                  Email Address
                </label>
                <input
                  className="input"
                  style={{ width: '100%', background: 'var(--paper-soft)', color: 'var(--muted)' }}
                  value={user.email}
                  disabled
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                  Email address is linked to your authentication provider.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink)' }}>
                  {user.role === 'admin' ? 'Agency or Workspace Brand Name' : 'Company Name'}
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Northstar Agency"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
                <button type="submit" className="button button-primary">
                  Save Changes
                </button>
                {saved && (
                  <span className="badge badge-positive" style={{ padding: '6px 12px' }}>
                    <CheckCircle2 size={13} style={{ marginRight: '4px' }} /> Changes saved successfully!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Account Security & Role Status Card */}
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div className="sociafy-metric-badge purple" style={{ width: '36px', height: '36px' }}>
                <Key size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Security & Permissions</h3>
                <span className="muted" style={{ fontSize: '12px' }}>Role capabilities and access levels</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {/* Account Role Row */}
              <div style={{ padding: '14px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                    Current Assigned Role
                  </span>
                  <span className={`badge ${user.role === 'admin' ? 'badge-positive' : 'badge-warning'}`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                  {user.role === 'admin'
                    ? 'You have full administrative privileges to connect APIs, configure tokens, add clients, and generate reports.'
                    : 'You have read-only access. Connecting new APIs or modifying clients is restricted.'}
                </p>
              </div>

              {/* Email Verification Row */}
              <div style={{ padding: '14px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                    Email Verification
                  </span>
                  {user.verified ? (
                    <span className="badge badge-positive">✓ Verified</span>
                  ) : (
                    <button
                      type="button"
                      className="button button-ghost"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={onVerify}
                    >
                      Verify Now
                    </button>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                  Confirmed for identity recovery and security alerts.
                </p>
              </div>

              {/* Token Vault Security */}
              <div style={{ padding: '14px', background: 'var(--paper-soft)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                    Token Vault Isolation
                  </span>
                  <span className="badge badge-neutral">AES-256</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                  All OAuth 2.0 access & refresh tokens are securely persisted on your local backend vault.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
