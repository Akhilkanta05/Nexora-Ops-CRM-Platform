import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, RefreshCw, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const [switching, setSwitching] = useState(false);

  const demoUsers = [
    { role: 'ADMIN', email: 'admin@funsrooms.com', pass: 'Admin@123', label: 'Admin' },
    { role: 'SALES', email: 'sales@funsrooms.com', pass: 'Sales@123', label: 'Sales' },
    { role: 'WAREHOUSE', email: 'warehouse@funsrooms.com', pass: 'Warehouse@123', label: 'Warehouse' },
    { role: 'ACCOUNTS', email: 'accounts@funsrooms.com', pass: 'Accounts@123', label: 'Accounts' },
  ];

  const handleQuickSwitch = async (email: string, pass: string) => {
    try {
      setSwitching(true);
      await login(email, pass);
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header
      style={{
        height: '68px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span
          style={{
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <ShieldCheck size={16} color="var(--accent-primary)" />
          Operations Portal
        </span>
      </div>

      {/* Role Switcher & User Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Quick Role Switcher for seamless testing */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-main)',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
            Switch Role:
          </span>
          {demoUsers.map((d) => (
            <button
              key={d.role}
              onClick={() => handleQuickSwitch(d.email, d.pass)}
              disabled={switching || user?.role === d.role}
              style={{
                background: user?.role === d.role ? 'var(--accent-primary)' : 'transparent',
                color: user?.role === d.role ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '0.2rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: user?.role === d.role ? 'default' : 'pointer',
                transition: 'var(--transition)',
              }}
              title={`Switch session to ${d.label} role`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Current User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingLeft: '0.75rem',
            borderLeft: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {user?.name?.charAt(0) || <UserIcon size={16} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.name}
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {user?.role}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={logout}
          title="Sign out of portal"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
