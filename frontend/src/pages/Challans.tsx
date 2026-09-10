import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MoreVertical,
  Check,
  Building2,
  FileCheck2,
} from 'lucide-react';

export const Challans: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedChallanId, setSelectedChallanId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Create Modal State
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

  // Status Action State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallans();
  }, [statusFilter]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const res = await api.getChallans({
        limit: 50,
        status: statusFilter || undefined,
      });
      if (res.success && res.data) {
        setChallans(res.data);
        if (res.data.length > 0 && !selectedChallanId) {
          setSelectedChallanId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedChallan = challans.find((c) => c.id === selectedChallanId) || challans[0] || null;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
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
    return challanItems.reduce((sum, item) => sum + calculateLineItemTotal(item.productId, item.quantity), 0);
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
      const res = await api.createChallan({
        customerId: selectedCustomer,
        status,
        notes: challanNotes,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
        })),
      });

      setCreateModalOpen(false);
      await fetchChallans();
      if (res.data?.id) {
        setSelectedChallanId(res.data.id);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create challan');
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
        await fetchChallans();
      }
    } catch (err: any) {
      setActionError(err.message || `Failed to update status to ${newStatus}`);
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

  const customerSnap = selectedChallan ? getParsedSnapshot(selectedChallan.customerSnapshot) : {};

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Middle Column: Master Feed of Challans / Bills */}
      <section className="col-master" style={{ padding: '1.75rem 1.25rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Bills</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                color: '#475569',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <option value="">All states</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {hasRole('SALES') && (
              <button
                className="btn btn-primary btn-sm"
                onClick={openCreateModal}
                style={{ borderRadius: '8px', padding: '0.45rem 0.8rem' }}
              >
                <Plus size={15} /> New
              </button>
            )}
          </div>
        </div>

        {/* Sub-header Filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            All bills ({challans.length})
          </span>
          <ChevronDown size={16} color="#94a3b8" />
        </div>

        {/* Card Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <span className="loading-spinner" />
            </div>
          ) : challans.length === 0 ? (
            <div className="empty-state">No bills or challans found.</div>
          ) : (
            challans.map((ch) => {
              const isSelected = selectedChallanId === ch.id;
              const isExpanded = !!expandedItems[ch.id];
              const snap = getParsedSnapshot(ch.customerSnapshot);

              let badgeClass = 'status-pill status-active';
              let badgeLabel = 'Active';
              if (ch.status === 'Confirmed') {
                badgeClass = 'status-pill status-confirmed';
                badgeLabel = 'Active';
              } else if (ch.status === 'Cancelled') {
                badgeClass = 'status-pill status-cancelled';
                badgeLabel = 'Cancelled';
              } else if (ch.status === 'Draft') {
                badgeClass = 'status-pill status-draft';
                badgeLabel = 'Draft';
              }

              return (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChallanId(ch.id)}
                  className={`feed-card ${isSelected ? 'selected' : ''}`}
                >
                  {/* Card Header Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {/* Checkbox */}
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                          background: isSelected ? 'var(--primary-blue)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                        }}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>

                      <span style={{ fontWeight: 800, fontSize: '0.925rem', color: '#0f172a' }}>
                        {ch.challanNumber}
                      </span>

                      <span className={badgeClass}>{badgeLabel}</span>
                    </div>

                    <a
                      href={api.downloadPdfUrl(ch.id)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#94a3b8', padding: '2px' }}
                      title="Open PDF Document"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>

                  {/* Card Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', gap: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8' }}>Balance:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹{Number(ch.totalAmount).toLocaleString('en-IN')}{' '}
                      <span style={{ color: '#94a3b8', fontWeight: 400 }}>/ {ch.totalQuantity} units</span>
                    </span>

                    <span style={{ color: '#94a3b8' }}>Requestor:</span>
                    <span style={{ color: '#334155', fontWeight: 500 }}>
                      {snap.name || ch.customer?.name}
                    </span>

                    <span style={{ color: '#94a3b8' }}>Date:</span>
                    <span style={{ color: 'var(--primary-blue)', textDecoration: 'underline', fontWeight: 500 }}>
                      {new Date(ch.createdAt).toLocaleDateString('en-GB')}
                    </span>

                    <span style={{ color: '#94a3b8' }}>Description:</span>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                      {ch.notes || `${snap.businessName || ch.customer?.businessName || 'Wholesale Order'} (#${ch.challanNumber.slice(-4)})`}
                    </span>
                  </div>

                  {/* Show Items Toggle */}
                  <div
                    onClick={(e) => toggleExpand(ch.id, e)}
                    style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.78rem',
                      color: 'var(--primary-blue)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{isExpanded ? 'Hide items' : 'Show items'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>

                  {/* Collapsible Line Items */}
                  {isExpanded && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.75rem' }}>
                      {ch.items?.map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                          <span style={{ color: '#334155' }}>{item.productName} (x{item.quantity})</span>
                          <span style={{ fontWeight: 600 }}>₹{Number(item.totalPrice).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Right Column: Live Document Sheet / Invoice Preview */}
      <main className="col-detail">
        {selectedChallan ? (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {actionError && (
              <div
                style={{
                  margin: '1.5rem 1.5rem 0 1.5rem',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                }}
              >
                {actionError}
              </div>
            )}

            {/* Document Paper Sheet */}
            <div className="document-sheet">
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  Invoice #{selectedChallan.challanNumber.replace('CH-', 'TRT')} ({selectedChallan.challanNumber})
                </h2>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={api.downloadPdfUrl(selectedChallan.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: '8px' }}
                  >
                    <Download size={14} /> Download PDF
                  </a>

                  {selectedChallan.status === 'Draft' && hasRole('SALES', 'WAREHOUSE') && (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate('Confirmed')}
                    >
                      <CheckCircle2 size={14} /> Confirm & Deduct Stock
                    </button>
                  )}

                  {selectedChallan.status === 'Confirmed' && hasRole('SALES', 'WAREHOUSE') && (
                    <button
                      className="btn btn-danger-outline btn-sm"
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate('Cancelled')}
                    >
                      <XCircle size={14} /> Cancel & Return Stock
                    </button>
                  )}
                </div>
              </div>

              {/* Addresses: Bill From & Bill To */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Bill from:</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    Warehouse Logistics Hub
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    Central Distribution Bay A-01, Industrial Corridor,<br />
                    Mumbai, Maharashtra 400072
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Bill to:</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    {customerSnap.name || selectedChallan.customer?.name}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    {customerSnap.businessName || selectedChallan.customer?.businessName}<br />
                    {customerSnap.address || selectedChallan.customer?.address}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Issued on:</div>
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0f172a' }}>
                    {new Date(selectedChallan.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Due on:</div>
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0f172a' }}>
                    {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Invoice Detail Section */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>Invoice detail</div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <th style={{ padding: '0.6rem 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Description</th>
                      <th style={{ padding: '0.6rem 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '0.6rem 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '0.6rem 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.items?.map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '0.85rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                          {item.productName}
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            SKU: {item.sku}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 0', fontSize: '0.875rem', textAlign: 'right', color: '#334155' }}>
                          ₹{Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.85rem 0', fontSize: '0.875rem', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '0.85rem 0', fontSize: '0.875rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₹{Number(item.totalPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grand Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Grand Total</span>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>
                  ₹{Number(selectedChallan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Notice Callout Box */}
              <div className="callout-box">
                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                <span>
                  {selectedChallan.status === 'Confirmed'
                    ? 'The warehouse inventory stock was atomically deducted upon confirmation. Dispatched to destination.'
                    : 'The customer will receive a formal delivery challan and tax invoice upon status confirmation.'}
                </span>
              </div>

              {/* Footer Bank & Tax Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
                <div>
                  <strong style={{ color: '#64748b' }}>Operations Distribution Hub</strong><br />
                  Plot 14, Commercial District, Western Hub, MH 400072<br />
                  GSTIN: 27AABCF1234F1Z8 | PAN: AABCF1234F
                </div>
                <div>
                  <strong style={{ color: '#64748b' }}>Settlement & Banking:</strong><br />
                  HDFC Bank Commercial Banking, Nariman Point<br />
                  A/C: 50200012345678 | IFSC: HDFC0000123
                </div>
              </div>
            </div>

            {/* Bottom Document Viewer Toolbar */}
            <div className="doc-toolbar">
              <button className="btn btn-secondary btn-sm" title="Zoom out">
                <ZoomOut size={15} />
              </button>
              <button className="btn btn-secondary btn-sm" title="Zoom in">
                <ZoomIn size={15} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0.5rem' }}>
                <button className="btn btn-secondary btn-sm" disabled style={{ padding: '0.35rem 0.5rem' }}>
                  <ChevronLeft size={15} />
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>1 / 1</span>
                <button className="btn btn-secondary btn-sm" disabled style={{ padding: '0.35rem 0.5rem' }}>
                  <ChevronRight size={15} />
                </button>
              </div>

              <button className="btn btn-secondary btn-sm" title="Fit to screen">
                <Maximize2 size={15} />
              </button>

              <button className="btn btn-secondary btn-sm" title="More options">
                <MoreVertical size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ margin: 'auto' }}>
            Select a bill or challan from the list to preview document details.
          </div>
        )}
      </main>

      {/* New Challan Builder Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Delivery Challan / Bill"
        maxWidth="750px"
      >
        {createError && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              padding: '0.85rem',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {createError}
          </div>
        )}

        <div>
          <div className="form-group">
            <label className="form-label">Select Customer Destination *</label>
            <select
              className="form-select"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">-- Choose Customer Account --</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.businessName} ({c.customerType})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Product Items *</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                <Plus size={13} /> Add Product
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
                      background: '#f8fafc',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: isOverStock ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    }}
                  >
                    <div>
                      <select
                        className="form-select"
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      >
                        <option value="">-- Select SKU --</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku}) — Stock: {p.currentStock}
                          </option>
                        ))}
                      </select>
                      {selectedProd && (
                        <div style={{ fontSize: '0.72rem', marginTop: '0.2rem', color: isOverStock ? '#ef4444' : '#64748b' }}>
                          Available: <strong>{selectedProd.currentStock} units</strong> @ ₹{selectedProd.unitPrice}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                      />
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={challanItems.length === 1}
                    >
                      <Trash2 size={14} color={challanItems.length === 1 ? '#94a3b8' : '#ef4444'} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: '#f1f5f9',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Total Order Value:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
              ₹{calculateGrandTotal().toLocaleString('en-IN')}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Dispatch Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dispatched via express cargo shipment"
              value={challanNotes}
              onChange={(e) => setChallanNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
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
              {submitting ? 'Confirming...' : 'Confirm & Dispatch'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
