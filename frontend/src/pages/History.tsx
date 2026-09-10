import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Download,
  Calendar,
  Package,
  FileCheck2,
  Users,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const History: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Fetch both stock movements and challans to create a unified enterprise audit trail
      const [movementsRes, challansRes, customersRes] = await Promise.all([
        api.getStockLogs({ limit: 100 }),
        api.getChallans({ limit: 50 }),
        api.getCustomers({ limit: 50 }),
      ]);

      const auditEvents: any[] = [];

      // 1. Stock Movement Events
      if (movementsRes.success && movementsRes.data) {
        movementsRes.data.forEach((m: any) => {
          auditEvents.push({
            id: `mov-${m.id}`,
            timestamp: new Date(m.createdAt),
            module: 'INVENTORY',
            action: m.movementType === 'IN' ? 'Stock Intake / Restock' : 'Stock Dispatch / Deduction',
            summary: `${m.product?.name || 'Item'} (${m.movementType === 'IN' ? '+' : '-'}${m.quantity} units)`,
            details: `Reason: ${m.reason} • Bay: ${m.product?.warehouseLocation || 'A-01'}`,
            user: m.user?.name || 'Warehouse Staff',
            role: m.user?.role || 'WAREHOUSE',
            type: m.movementType,
            badgeColor: m.movementType === 'IN' ? 'var(--success)' : 'var(--danger)',
          });
        });
      }

      // 2. Challan Lifecycle Events
      if (challansRes.success && challansRes.data) {
        challansRes.data.forEach((ch: any) => {
          auditEvents.push({
            id: `ch-${ch.id}`,
            timestamp: new Date(ch.createdAt),
            module: 'CHALLANS',
            action: `Challan ${ch.challanNumber} (${ch.status})`,
            summary: `Issued to ${ch.customer?.businessName || ch.customer?.name} • ₹${Number(ch.totalAmount).toLocaleString('en-IN')}`,
            details: `${ch.totalQuantity} units across ${ch.items?.length || 1} line items. Status: ${ch.status}`,
            user: ch.createdBy?.name || 'Sales Officer',
            role: ch.createdBy?.role || 'SALES',
            type: ch.status,
            badgeColor: ch.status === 'Confirmed' ? 'var(--primary-blue)' : 'var(--warning)',
          });
        });
      }

      // 3. Customer CRM Follow-up Events
      if (customersRes.success && customersRes.data) {
        customersRes.data.forEach((c: any) => {
          if (c.followUpDate) {
            auditEvents.push({
              id: `crm-${c.id}`,
              timestamp: new Date(c.createdAt || Date.now()),
              module: 'CRM',
              action: `Lead Account Added: ${c.businessName || c.name}`,
              summary: `Customer type: ${c.customerType} • Status: ${c.status}`,
              details: `Follow-up set for ${new Date(c.followUpDate).toLocaleDateString('en-GB')}`,
              user: 'Sales Representative',
              role: 'SALES',
              type: c.status,
              badgeColor: 'var(--accent-light)',
            });
          }
        });
      }

      // Sort by newest timestamp
      auditEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setLogs(auditEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === '' ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.summary.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesModule = !moduleFilter || log.module === moduleFilter;
    const matchesType = !typeFilter || log.type === typeFilter;

    return matchesSearch && matchesModule && matchesType;
  });

  const exportCsv = () => {
    const headers = ['Timestamp', 'Module', 'Action', 'Summary', 'Details', 'User', 'Role'];
    const rows = filteredLogs.map((l) => [
      l.timestamp.toISOString(),
      l.module,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.summary.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.user}"`,
      l.role,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexora_audit_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HistoryIcon size={26} color="var(--primary-blue)" /> System History & Audit Trail
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Immutable chronological operation logs across Challans, Inventory Movements, CRM notes, and Sessions.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={exportCsv} disabled={filteredLogs.length === 0}>
          <Download size={15} /> Export Audit Log (CSV)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search audit trail by SKU, Challan #, user, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Module Filter */}
          <select
            className="form-select"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="">All Operating Modules</option>
            <option value="INVENTORY">Inventory & Stock Movements</option>
            <option value="CHALLANS">Delivery Challans & Invoices</option>
            <option value="CRM">Customer CRM & Accounts</option>
          </select>

          {/* Type Filter */}
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Event Statuses</option>
            <option value="IN">Stock Intake (IN)</option>
            <option value="OUT">Stock Deduction (OUT)</option>
            <option value="Confirmed">Challan Confirmed</option>
            <option value="Draft">Challan Draft</option>
            <option value="Active">Active Customers</option>
          </select>
        </div>
      </div>

      {/* Audit History Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>Timestamp</th>
              <th style={{ width: '120px' }}>Module</th>
              <th>Action / Event</th>
              <th>Summary & Impact</th>
              <th>Audit Reference</th>
              <th style={{ width: '150px' }}>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="loading-spinner" />
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Aggregating system audit logs...</div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No audit history records matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={13} color="var(--primary-blue)" />
                      {log.timestamp.toLocaleDateString('en-GB')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '1.2rem' }}>
                      {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        background:
                          log.module === 'INVENTORY'
                            ? '#fef3c7'
                            : log.module === 'CHALLANS'
                            ? '#eff6ff'
                            : '#f3e8ff',
                        color:
                          log.module === 'INVENTORY'
                            ? '#b45309'
                            : log.module === 'CHALLANS'
                            ? '#1d4ed8'
                            : '#7e22ce',
                      }}
                    >
                      {log.module === 'INVENTORY' && <Package size={11} />}
                      {log.module === 'CHALLANS' && <FileCheck2 size={11} />}
                      {log.module === 'CRM' && <Users size={11} />}
                      {log.module}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{log.action}</strong>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>{log.summary}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.details}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.user}</div>
                    <Badge type="role" value={log.role} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
