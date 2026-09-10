import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import {
  Users,
  Package,
  FileCheck2,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  PlusCircle,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardOverview();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem' }}>
        <span className="loading-spinner" />
        <p style={{ marginTop: '1rem' }}>Loading operational metrics...</p>
      </div>
    );
  }

  const kpi = data?.kpi || {};

  return (
    <div className="page-wrapper">
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Operations Hub
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>. Logged in with{' '}
            <Badge type="role" value={user?.role || ''} /> permissions.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {hasRole('SALES') && (
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('challans')}>
              <PlusCircle size={15} /> New Sales Challan
            </button>
          )}
          {hasRole('SALES') && (
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('customers')}>
              <Users size={15} /> Add Customer
            </button>
          )}
          {hasRole('WAREHOUSE') && (
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('products')}>
              <Package size={15} /> Adjust Stock
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {/* Customers KPI */}
        <div className="card card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL CUSTOMERS</span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {kpi.customers?.total || 0}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--success)' }}>{kpi.customers?.active || 0} Active</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--warning)' }}>{kpi.customers?.leads || 0} Leads</span>
          </div>
        </div>

        {/* Inventory Units */}
        <div className="card card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL STOCK UNITS</span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--info)' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {kpi.inventory?.totalUnits?.toLocaleString() || 0}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Across {kpi.inventory?.totalProducts || 0} active SKU codes
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card card-hover" style={{ borderColor: kpi.inventory?.lowStockCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>LOW STOCK ALERTS</span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: kpi.inventory?.lowStockCount > 0 ? '#f87171' : 'var(--text-primary)' }}>
            {kpi.inventory?.lowStockCount || 0}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            {kpi.inventory?.lowStockCount > 0 ? (
              <span className="stock-alert-pill">Action Required in Warehouse</span>
            ) : (
              <span style={{ color: 'var(--success)' }}>All SKUs healthy</span>
            )}
          </div>
        </div>

        {/* Challans & Revenue */}
        <div className="card card-hover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>CONFIRMED REVENUE</span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₹{Number(kpi.challans?.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--success)' }}>{kpi.challans?.confirmed || 0} Confirmed</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--warning)' }}>{kpi.challans?.draft || 0} Drafts</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Follow-ups */}
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        {/* Recent Challans */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck2 size={18} color="var(--accent-primary)" />
              Recent Sales Challans
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('challans')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data?.recentChallans?.length > 0 ? (
              data.recentChallans.map((ch: any) => (
                <div
                  key={ch.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {ch.challanNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ch.customer?.businessName || ch.customer?.name} • {ch.totalQuantity} items
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      ₹{Number(ch.totalAmount).toLocaleString('en-IN')}
                    </div>
                    <Badge type="status" value={ch.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No sales challans recorded yet.</div>
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--info)" />
              Live Stock Movements
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('stock-logs')}>
              Full Audit
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data?.recentStockMovements?.length > 0 ? (
              data.recentStockMovements.map((log: any) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        padding: '0.4rem',
                        borderRadius: 'var(--radius-full)',
                        background: log.movementType === 'IN' ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: log.movementType === 'IN' ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {log.movementType === 'IN' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.product?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.reason}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: log.movementType === 'IN' ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {log.movementType === 'IN' ? `+${log.quantity}` : `-${log.quantity}`}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No stock movements recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Follow-ups Bar */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--warning)" />
            Scheduled CRM Follow-ups (Next 7 Days)
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('customers')}>
            Go to CRM
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {data?.upcomingFollowUps?.length > 0 ? (
            data.upcomingFollowUps.map((f: any) => (
              <div
                key={f.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{f.name}</span>
                  <Badge type="status" value={f.status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.businessName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Phone: {f.mobile}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--warning)',
                    marginTop: '0.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Calendar size={13} />
                  Due: {new Date(f.followUpDate).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '1.5rem' }}>
              No follow-ups due in the next 7 days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
