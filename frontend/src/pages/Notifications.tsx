import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  AlertTriangle,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Check,
  Trash2,
  ExternalLink,
  Clock,
  Package,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface NotificationsProps {
  onNavigate: (tab: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'stock' | 'crm' | 'challans'>('all');

  useEffect(() => {
    fetchLiveNotifications();
  }, []);

  const fetchLiveNotifications = async () => {
    try {
      setLoading(true);
      const [prodRes, custRes, challanRes] = await Promise.all([
        api.getProducts({ limit: 100 }),
        api.getCustomers({ limit: 100 }),
        api.getChallans({ limit: 50 }),
      ]);

      const items: any[] = [];

      // 1. Low Stock Inventory Alerts
      if (prodRes.success && prodRes.data) {
        prodRes.data.forEach((p: any) => {
          if (p.currentStock <= p.minStockAlert) {
            items.push({
              id: `stock-${p.id}`,
              type: 'stock',
              priority: 'HIGH',
              title: `Critical Low Stock Alert: ${p.name}`,
              description: `Current inventory is ${p.currentStock} units, which is at or below the minimum alert threshold of ${p.minStockAlert} units. Warehouse Bay: ${p.warehouseLocation}.`,
              timestamp: new Date(Date.now() - 35 * 60 * 1000), // 35 min ago
              read: false,
              actionLabel: 'Restock Product',
              targetTab: 'products',
            });
          }
        });
      }

      // 2. Upcoming CRM Follow-ups
      if (custRes.success && custRes.data) {
        custRes.data.forEach((c: any) => {
          if (c.followUpDate) {
            const dueDate = new Date(c.followUpDate);
            const isDueSoon = dueDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
            if (isDueSoon) {
              items.push({
                id: `crm-${c.id}`,
                type: 'crm',
                priority: 'MEDIUM',
                title: `CRM Follow-up Scheduled: ${c.businessName || c.name}`,
                description: `Follow-up contact is due on ${dueDate.toLocaleDateString('en-GB')}. Contact person: ${c.name} (${c.mobile}). Account status: ${c.status}.`,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hrs ago
                read: false,
                actionLabel: 'Open CRM Account',
                targetTab: 'customers',
              });
            }
          }
        });
      }

      // 3. Challans Confirmed & Stock Deductions
      if (challanRes.success && challanRes.data) {
        challanRes.data.slice(0, 5).forEach((ch: any) => {
          items.push({
            id: `challan-${ch.id}`,
            type: 'challans',
            priority: ch.status === 'Confirmed' ? 'NORMAL' : 'LOW',
            title: `Sales Challan ${ch.status}: ${ch.challanNumber}`,
            description: `Challan for ${ch.customer?.businessName || ch.customer?.name} with ${ch.totalQuantity} units (₹${Number(ch.totalAmount).toLocaleString('en-IN')}) is now ${ch.status}.`,
            timestamp: new Date(ch.createdAt),
            read: ch.status !== 'Draft',
            actionLabel: 'View Challan & Invoice',
            targetTab: 'challans',
          });
        });
      }

      // 4. Welcome System Notification
      items.push({
        id: 'sys-welcome',
        type: 'system',
        priority: 'INFO',
        title: `Nexora Platform Online — Session Verified`,
        description: `Logged in under ${user?.role} permissions. Database connection, inventory sync, and atomic stock engine are active.`,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        actionLabel: 'View Account Profile',
        targetTab: 'account',
      });

      // Sort by unread first, then newest
      items.sort((a, b) => {
        if (a.read === b.read) {
          return b.timestamp.getTime() - a.timestamp.getTime();
        }
        return a.read ? 1 : -1;
      });

      setNotifications(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={26} color="var(--primary-blue)" /> Operational Notifications
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Live alert stream for low stock warnings, scheduled CRM follow-ups, and dispatch orders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check size={15} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`role-pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          onClick={() => setActiveFilter('all')}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          className={`role-pill-btn ${activeFilter === 'stock' ? 'active' : ''}`}
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          onClick={() => setActiveFilter('stock')}
        >
          Low Stock Warnings ({notifications.filter((n) => n.type === 'stock').length})
        </button>
        <button
          className={`role-pill-btn ${activeFilter === 'crm' ? 'active' : ''}`}
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          onClick={() => setActiveFilter('crm')}
        >
          CRM Follow-ups ({notifications.filter((n) => n.type === 'crm').length})
        </button>
        <button
          className={`role-pill-btn ${activeFilter === 'challans' ? 'active' : ''}`}
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          onClick={() => setActiveFilter('challans')}
        >
          Challans & Dispatches ({notifications.filter((n) => n.type === 'challans').length})
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <span className="loading-spinner" />
            <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Retrieving system notifications...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
            <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.15rem' }}>All Caught Up</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              No notifications matching the selected category filter.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isStock = notif.type === 'stock';
            const isCrm = notif.type === 'crm';
            const isChallan = notif.type === 'challans';

            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className="card card-hover"
                style={{
                  padding: '1.15rem 1.35rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  background: notif.read ? '#ffffff' : '#f8fafc',
                  borderLeft: notif.read
                    ? '1px solid var(--border-subtle)'
                    : isStock
                    ? '4px solid var(--danger)'
                    : isCrm
                    ? '4px solid var(--warning)'
                    : '4px solid var(--primary-blue)',
                  cursor: 'pointer',
                }}
              >
                {/* Icon Badge */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isStock
                      ? '#fee2e2'
                      : isCrm
                      ? '#fef3c7'
                      : isChallan
                      ? '#eff6ff'
                      : '#f1f5f9',
                    color: isStock
                      ? '#b91c1c'
                      : isCrm
                      ? '#b45309'
                      : isChallan
                      ? '#1d4ed8'
                      : '#475569',
                  }}
                >
                  {isStock && <AlertTriangle size={20} />}
                  {isCrm && <Calendar size={20} />}
                  {isChallan && <FileCheck2 size={20} />}
                  {!isStock && !isCrm && !isChallan && <ShieldCheck size={20} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.925rem', color: '#0f172a' }}>{notif.title}</strong>
                      {!notif.read && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--primary-blue)',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </div>

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {notif.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(notif.targetTab);
                      }}
                    >
                      {notif.actionLabel} <ArrowRight size={12} />
                    </button>

                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', color: '#94a3b8' }}
                      onClick={(e) => deleteNotification(notif.id, e)}
                      title="Dismiss notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
