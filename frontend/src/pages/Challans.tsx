import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  PlusCircle,
  Building2,
  Calendar,
  User,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export const Challans: React.FC = () => {
  const { hasRole, user } = useAuth();
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Create Challan Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [challanNotes, setChallanNotes] = useState('');
  const [challanItems, setChallanItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [selectedChallan, setSelectedChallan] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallans(1);
  }, [search, statusFilter]);

  const fetchChallans = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getChallans({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setChallans(res.data || []);
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

  const openCreateModal = async () => {
    setCreateError(null);
    setChallanNotes('');
    setChallanItems([{ productId: '', quantity: 1 }]);
    setSelectedCustomer('');
    setCreateModalOpen(true);

    try {
      const [custRes, prodRes] = await Promise.all([
        api.getCustomers({ limit: 100 }),
        api.getProducts({ limit: 100 }),
      ]);
      if (custRes.success) setCustomersList(custRes.data || []);
      if (prodRes.success) setProductsList(prodRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openDetail = async (id: string) => {
    setActionError(null);
    try {
      const res = await api.getChallanById(id);
      if (res.success) {
        setSelectedChallan(res.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItemRow = () => {
    setChallanItems([...challanItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (challanItems.length === 1) return;
    setChallanItems(challanItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', val: any) => {
    const updated = [...challanItems];
    updated[index] = { ...updated[index], [field]: val };
    setChallanItems(updated);
  };

  const calculateLineItemTotal = (productId: string, quantity: number) => {
    const prod = productsList.find((p) => p.id === productId);
    if (!prod) return 0;
    return (prod.unitPrice || 0) * (quantity || 0);
  };

  const calculateGrandTotal = () => {
    return challanItems.reduce((sum, item) => {
      return sum + calculateLineItemTotal(item.productId, item.quantity);
    }, 0);
  };

  const calculateTotalQty = () => {
    return challanItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const handleCreateChallan = async (status: 'Draft' | 'Confirmed') => {
    setCreateError(null);

    if (!selectedCustomer) {
      setCreateError('Please select a customer for this challan.');
      return;
    }

    const validItems = challanItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setCreateError('Please add at least one valid product line item.');
      return;
    }

    // Client-side pre-check for confirmed status
    if (status === 'Confirmed') {
      for (const item of validItems) {
        const prod = productsList.find((p) => p.id === item.productId);
        if (prod && item.quantity > prod.currentStock) {
          setCreateError(
            `Insufficient stock for "${prod.name}". Available: ${prod.currentStock} units, Requested: ${item.quantity} units.`
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await api.createChallan({
        customerId: selectedCustomer,
        status,
        notes: challanNotes,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
        })),
      });

      setCreateModalOpen(false);
      fetchChallans(1);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'Confirmed' | 'Cancelled') => {
    if (!selectedChallan) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await api.updateChallanStatus(selectedChallan.id, newStatus);
      if (res.success) {
        setSelectedChallan(res.data);
        fetchChallans(pagination.page);
      }
    } catch (err: any) {
      setActionError(err.message || `Failed to update challan to ${newStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getParsedSnapshot = (snapshot: any) => {
    try {
      return typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
    } catch {
      return {};
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Sales Challans & Dispatch</h1>
          <p>Create multi-item delivery challans with automated numbering, snapshots & atomic stock deductions.</p>
        </div>

        {hasRole('SALES') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> New Sales Challan
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by challan number (e.g. CH-2026...) or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Status Filter */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Challan Statuses</option>
            <option value="Confirmed">Confirmed (Stock Deducted)</option>
            <option value="Draft">Draft (Pending Approval)</option>
            <option value="Cancelled">Cancelled (Stock Reverted)</option>
          </select>
        </div>
      </div>

      {/* Challans Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Challan Number</th>
              <th>Customer & Business</th>
              <th>Items & Qty</th>
              <th>Total Amount (INR)</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="loading-spinner" />
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Loading sales challans...</div>
                </td>
              </tr>
            ) : challans.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No sales challans found.
                </td>
              </tr>
            ) : (
              challans.map((ch) => (
                <tr key={ch.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(ch.id)}>
                  <td>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-light)' }}>
                      {ch.challanNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ch.customer?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ch.customer?.businessName}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ch.totalQuantity} units</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ch.items?.length || 0} product line(s)
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      ₹{Number(ch.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <Badge type="status" value={ch.status} />
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {ch.createdByName}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openDetail(ch.id)}
                        title="View Full Challan Details"
                      >
                        View
                      </button>
                      <a
                        href={api.downloadPdfUrl(ch.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        title="Download Invoice PDF"
                      >
                        <Download size={13} /> PDF
                      </a>
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
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total challans)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchChallans(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchChallans(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Challan Multi-Product Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Sales Delivery Challan"
        maxWidth="780px"
      >
        {createError && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'pre-wrap' }}>{createError}</span>
          </div>
        )}

        <div>
          {/* Customer Selection */}
          <div className="form-group">
            <label className="form-label">Select Customer / Delivery Destination *</label>
            <select
              className="form-select"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              required
            >
              <option value="">-- Choose Customer Account --</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.businessName} ({c.customerType})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Multi-product Builder */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Challan Product Line Items *
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItemRow}
              >
                <PlusCircle size={14} /> Add Product Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {challanItems.map((item, index) => {
                const selectedProd = productsList.find((p) => p.id === item.productId);
                const lineTotal = calculateLineItemTotal(item.productId, item.quantity);
                const isOverStock = selectedProd && item.quantity > selectedProd.currentStock;

                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2.5fr 1fr 1fr auto',
                      gap: '0.75rem',
                      alignItems: 'center',
                      background: 'var(--bg-main)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: isOverStock ? '1px solid var(--danger)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Product Dropdown */}
                    <div>
                      <select
                        className="form-select"
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      >
                        <option value="">-- Select SKU / Product --</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku}) — Stock: {p.currentStock}
                          </option>
                        ))}
                      </select>
                      {selectedProd && (
                        <div style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: isOverStock ? '#f87171' : 'var(--text-muted)' }}>
                          Available: <strong>{selectedProd.currentStock} units</strong> @ ₹{selectedProd.unitPrice}/unit
                        </div>
                      )}
                    </div>

                    {/* Quantity Input */}
                    <div>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                      />
                      {isOverStock && (
                        <div style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '0.2rem' }}>
                          Exceeds stock!
                        </div>
                      )}
                    </div>

                    {/* Line Total */}
                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </div>

                    {/* Delete Item Row */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={challanItems.length === 1}
                      title="Remove Item"
                    >
                      <Trash2 size={15} color={challanItems.length === 1 ? 'var(--text-muted)' : 'var(--danger)'} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Summary */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Items Quantity</span>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{calculateTotalQty()} units</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grand Invoice Total</span>
              <div style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--accent-light)' }}>
                ₹{calculateGrandTotal().toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Dispatch / Order Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dispatched through Express Cargo. Gate pass #9914."
              value={challanNotes}
              onChange={(e) => setChallanNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              * Confirming immediately validates & reduces inventory atomically.
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => handleCreateChallan('Draft')}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={() => handleCreateChallan('Confirmed')}
              >
                {submitting ? 'Processing...' : 'Confirm & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Challan Detail & PDF Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedChallan(null);
        }}
        title={`Challan: ${selectedChallan?.challanNumber || ''}`}
        maxWidth="750px"
      >
        {selectedChallan && (
          <div>
            {actionError && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'pre-wrap' }}>{actionError}</span>
              </div>
            )}

            {/* Metadata bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</div>
                <div style={{ marginTop: '0.2rem' }}>
                  <Badge type="status" value={selectedChallan.status} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GENERATED DATE</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {new Date(selectedChallan.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CREATED BY</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {selectedChallan.createdByName}
                </div>
              </div>
              <div>
                <a
                  href={api.downloadPdfUrl(selectedChallan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <Download size={14} /> Download PDF
                </a>
              </div>
            </div>

            {/* Customer Snapshot Card */}
            {(() => {
              const snap = getParsedSnapshot(selectedChallan.customerSnapshot);
              return (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Customer Snapshot (At Generation)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div><strong>Customer:</strong> {snap.name || selectedChallan.customer?.name}</div>
                    <div><strong>Business:</strong> {snap.businessName || selectedChallan.customer?.businessName}</div>
                    <div><strong>Contact:</strong> {snap.mobile || selectedChallan.customer?.mobile}</div>
                    <div><strong>GSTIN:</strong> {snap.gstNumber || 'N/A'}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>Delivery Address:</strong> {snap.address || selectedChallan.customer?.address}</div>
                  </div>
                </div>
              );
            })()}

            {/* Line Items Snapshot Table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Product Items Snapshot
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product Description</th>
                      <th>SKU</th>
                      <th>Unit Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.productName}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{item.sku}</td>
                        <td>₹{Number(item.unitPrice).toFixed(2)}</td>
                        <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(item.totalPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginBottom: '1.5rem', padding: '0.5rem 1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Units: </span>
                <strong>{selectedChallan.totalQuantity}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grand Total: </span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--accent-light)' }}>
                  ₹{Number(selectedChallan.totalAmount).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {selectedChallan.notes && (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Notes:</strong> {selectedChallan.notes}
              </div>
            )}

            {/* Status Change Actions */}
            <div className="modal-footer" style={{ padding: '1rem 0 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selectedChallan.status === 'Draft' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                    Draft challan has not reduced warehouse stock yet.
                  </span>
                )}
                {selectedChallan.status === 'Confirmed' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                    Confirmed: Stock deducted and logged in audit history.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {selectedChallan.status === 'Draft' && hasRole('SALES', 'WAREHOUSE') && (
                  <button
                    className="btn btn-success"
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate('Confirmed')}
                  >
                    <CheckCircle2 size={16} /> Confirm & Deduct Stock
                  </button>
                )}

                {selectedChallan.status === 'Confirmed' && hasRole('SALES', 'WAREHOUSE') && (
                  <button
                    className="btn btn-danger"
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate('Cancelled')}
                  >
                    <XCircle size={16} /> Cancel Challan & Return Stock
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetailModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
