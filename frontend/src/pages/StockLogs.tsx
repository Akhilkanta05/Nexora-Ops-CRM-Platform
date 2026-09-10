import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Calendar,
  User,
  Package,
} from 'lucide-react';

export const StockLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementFilter, setMovementFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchLogs(1);
  }, [movementFilter]);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getStockLogs({
        page,
        limit: 15,
        movementType: movementFilter || undefined,
      });
      if (res.success) {
        setLogs(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Stock Movement Audit Trail</h1>
          <p>Chronological immutable ledger of all inventory intakes, challan deductions, and adjustments.</p>
        </div>

        {/* Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={movementFilter}
            onChange={(e) => setMovementFilter(e.target.value)}
          >
            <option value="">All Movement Types (IN & OUT)</option>
            <option value="IN">IN Only (Intake, Restock, Returns)</option>
            <option value="OUT">OUT Only (Challans, Reductions)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product Description & SKU</th>
              <th>Movement Type</th>
              <th>Quantity Changed</th>
              <th>Audit Reason / Reference</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="loading-spinner" />
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Loading movement audit trail...</div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No stock movement records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={13} color="var(--accent-primary)" />
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {log.product?.name || 'Item'}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {log.product?.sku}
                    </div>
                  </td>
                  <td>
                    <Badge type="movement" value={log.movementType} />
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: log.movementType === 'IN' ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {log.movementType === 'IN' ? `+${log.quantity}` : `-${log.quantity}`} units
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.reason}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <User size={13} />
                      {log.createdBy}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total movement logs)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
