import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import {
  User,
  Shield,
  Key,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Smartphone,
  Save,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Account: React.FC = () => {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password Change Mock Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ text: 'Please fill all password fields.', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', error: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', error: true });
      return;
    }

    setPasswordMsg({ text: 'Password updated successfully!', error: false });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 3000);
  };

  // Role permissions mapping
  const permissions = [
    {
      module: 'Customer CRM',
      admin: true,
      sales: true,
      warehouse: false,
      accounts: true,
      description: 'Manage client accounts, contact leads, and CRM follow-up timelines',
    },
    {
      module: 'Product Catalog',
      admin: true,
      sales: true,
      warehouse: true,
      accounts: true,
      description: 'View SKU codes, unit prices, categories, and warehouse bay locations',
    },
    {
      module: 'Inventory Adjustments',
      admin: true,
      sales: false,
      warehouse: true,
      accounts: false,
      description: 'Perform stock IN/OUT adjustments with mandatory audit trail reasons',
    },
    {
      module: 'Sales Challans Creation',
      admin: true,
      sales: true,
      warehouse: false,
      accounts: false,
      description: 'Create multi-item delivery challans in Draft state',
    },
    {
      module: 'Challan Confirmation & Stock Deduct',
      admin: true,
      sales: true,
      warehouse: true,
      accounts: false,
      description: 'Atomically deduct warehouse inventory and issue active delivery challans',
    },
    {
      module: 'PDF Invoices & Financial Reports',
      admin: true,
      sales: true,
      warehouse: true,
      accounts: true,
      description: 'Download delivery challan and tax invoice PDFs with GSTIN breakdowns',
    },
    {
      module: 'Global Enterprise Configuration',
      admin: true,
      sales: false,
      warehouse: false,
      accounts: false,
      description: 'Configure warehouse locations, tax parameters, and operational policies',
    },
  ];

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return '#2563eb';
      case 'SALES':
        return '#16a34a';
      case 'WAREHOUSE':
        return '#d97706';
      case 'ACCOUNTS':
        return '#9333ea';
      default:
        return '#475569';
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <User size={26} color="var(--primary-blue)" /> Account & Profile
        </h1>
        <p style={{ marginTop: '0.25rem' }}>
          Manage your personal credentials, session details, and operational role authorizations.
        </p>
      </div>

      {/* Profile Top Grid */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {/* User Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: getRoleBadgeColor(user?.role),
              color: '#ffffff',
              fontSize: '1.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user?.name}</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            {user?.email}
          </div>

          <Badge type="role" value={user?.role || ''} />

          <div
            style={{
              width: '100%',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Organization:</span>
              <strong style={{ color: 'var(--text-primary)' }}>Nexora Enterprises</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Security Level:</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Standard Enterprise (256-bit)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Session:</span>
              <span style={{ color: 'var(--primary-blue)', fontFamily: 'var(--font-mono)' }}>JWT Authenticated</span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--primary-blue)" /> Personal Information
          </h3>

          {savedSuccess && (
            <div
              style={{
                background: 'var(--success-bg)',
                color: 'var(--success)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} /> Profile changes saved successfully!
            </div>
          )}

          <form onSubmit={handleSaveProfile}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ background: '#f8fafc', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Primary Mobile Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={
                    user?.role === 'ADMIN'
                      ? 'Executive Administration'
                      : user?.role === 'SALES'
                      ? 'Commercial Distribution & CRM'
                      : user?.role === 'WAREHOUSE'
                      ? 'Logistics & Warehouse Operations'
                      : 'Finance & Accounts'
                  }
                  disabled
                  style={{ background: '#f8fafc', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={15} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--primary-blue)" /> Role Authorizations & Permissions Matrix
            </h3>
            <p style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>
              Your current role (<strong style={{ color: getRoleBadgeColor(user?.role) }}>{user?.role}</strong>) grants access to the marked capabilities below.
            </p>
          </div>
          <Badge type="role" value={user?.role || ''} />
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Module & Capability</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Your Access</th>
                <th style={{ textAlign: 'center' }}>Admin</th>
                <th style={{ textAlign: 'center' }}>Sales</th>
                <th style={{ textAlign: 'center' }}>Warehouse</th>
                <th style={{ textAlign: 'center' }}>Accounts</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, idx) => {
                const userHasAccess =
                  user?.role === 'ADMIN'
                    ? p.admin
                    : user?.role === 'SALES'
                    ? p.sales
                    : user?.role === 'WAREHOUSE'
                    ? p.warehouse
                    : p.accounts;

                return (
                  <tr key={idx}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.module}</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {p.description}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {userHasAccess ? (
                        <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.78rem' }}>
                          <CheckCircle2 size={16} /> Granted
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem' }}>
                          <XCircle size={16} /> Restricted
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{p.admin ? '✓' : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{p.sales ? '✓' : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{p.warehouse ? '✓' : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{p.accounts ? '✓' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security & Password Section */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={18} color="var(--primary-blue)" /> Change Password
          </h3>

          {passwordMsg && (
            <div
              style={{
                background: passwordMsg.error ? 'var(--danger-bg)' : 'var(--success-bg)',
                color: passwordMsg.error ? 'var(--danger)' : 'var(--success)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              <Lock size={14} /> Update Security Password
            </button>
          </form>
        </div>

        {/* Session & Device Logs */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--primary-blue)" /> Active Security Session
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div
              style={{
                padding: '0.85rem 1rem',
                background: 'var(--bg-main)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Current Web Workstation</strong>
                <span className="badge badge-active">Active Now</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                Chrome / Windows 11 Enterprise • IP: 127.0.0.1
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                Connected to Nexora Backend API (Node.js/Express)
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem 1rem',
                background: 'var(--bg-main)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Token Security Details</strong>
                <span className="badge badge-role">JWT HS256</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                Tokens expire automatically after 24 hours of inactivity.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
