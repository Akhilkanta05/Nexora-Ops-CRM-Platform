import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Box,
  Users2,
  FileBarChart,
  ShieldCheck,
  ArrowLeftRight,
  User,
  History,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  counts?: {
    challans?: number;
    customers?: number;
    products?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, counts }) => {
  const { user, logout, login, hasRole } = useAuth();

  const demoRoles = [
    { role: 'ADMIN', email: 'admin@nexora.com', pass: 'Admin@123', label: 'Admin' },
    { role: 'SALES', email: 'sales@nexora.com', pass: 'Sales@123', label: 'Sales' },
    { role: 'WAREHOUSE', email: 'warehouse@nexora.com', pass: 'Warehouse@123', label: 'Warehouse' },
    { role: 'ACCOUNTS', email: 'accounts@nexora.com', pass: 'Accounts@123', label: 'Accounts' },
  ];

  const handleRoleSwitch = async (email: string, pass: string) => {
    try {
      await login(email, pass);
    } catch (e) {
      console.error(e);
    }
  };

  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, count: null },
    { id: 'challans', label: 'Bills', icon: ShieldCheck, count: counts?.challans || 4 },
    { id: 'products', label: 'Products', icon: Box, count: null },
    { id: 'customers', label: 'Customers', icon: Users2, count: null },
    { id: 'stock-logs', label: 'Reports', icon: FileBarChart, count: null },
    { id: 'transactions', label: 'Transaction', icon: ArrowLeftRight, count: null },
  ];

  const accountItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'history', label: 'History', icon: History },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="col-sidebar">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            border: '2px solid #0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            fontWeight: 800,
            fontSize: '1.05rem',
          }}
        >
          <span style={{ transform: 'translateY(-1px)' }}>N</span>
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', display: 'block', lineHeight: 1.15 }}>
            Nexora
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.02em', display: 'block', textTransform: 'uppercase' }}>
            Ops & CRM Platform
          </span>
        </div>
      </div>

      {/* MENU Section */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            paddingLeft: '0.5rem',
          }}
        >
          MENU
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={isActive ? 'var(--primary-blue)' : '#64748b'} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </div>
                {item.count && (
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'var(--primary-blue)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ACCOUNT Section */}
      <div>
        <div
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
            paddingLeft: '0.5rem',
          }}
        >
          ACCOUNT
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {accountItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={isActive ? 'var(--primary-blue)' : '#64748b'} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher & User Profile Pill at Bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          SWITCH ROLE (DEMO)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem', marginBottom: '0.85rem' }}>
          {demoRoles.map((r) => {
            const isCurrent = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => handleRoleSwitch(r.email, r.pass)}
                style={{
                  background: isCurrent ? '#eff6ff' : '#f8fafc',
                  border: isCurrent ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  color: isCurrent ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.4rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: isCurrent ? 'default' : 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#334155',
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{user?.name?.split(' ')[0]}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--primary-blue)', fontWeight: 600 }}>{user?.role}</div>
            </div>
          </div>

          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
