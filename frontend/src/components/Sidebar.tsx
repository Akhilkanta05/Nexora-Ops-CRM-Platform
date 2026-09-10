import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  FileText,
  Boxes,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { hasRole } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'customers', label: 'Customer CRM', icon: Users, visible: hasRole('SALES', 'ACCOUNTS') },
    { id: 'products', label: 'Inventory & Stock', icon: Package, visible: true },
    { id: 'stock-logs', label: 'Stock Movement Logs', icon: ArrowLeftRight, visible: hasRole('WAREHOUSE', 'SALES', 'ACCOUNTS') },
    { id: 'challans', label: 'Sales Challans', icon: FileText, visible: hasRole('SALES', 'WAREHOUSE', 'ACCOUNTS') },
  ];

  return (
    <aside
      style={{
        width: '260px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Boxes size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            FUNSROOMS
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Mini ERP + CRM
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            fontWeight: 700,
            padding: '0.5rem 0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Operations Menu
        </div>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                  borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                }}
              >
                <Icon
                  size={18}
                  color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'}
                />
                {item.label}
              </button>
            );
          })}
      </nav>

      {/* Wholesale Operations Badge at bottom */}
      <div style={{ marginTop: 'auto', padding: '1.25rem' }}>
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-light)' }}>
            Wholesale Logistics
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Multi-tier inventory, auto challan sequencing & atomic stock guard.
          </div>
        </div>
      </div>
    </aside>
  );
};
