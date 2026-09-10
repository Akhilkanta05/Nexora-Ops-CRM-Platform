import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  SlidersHorizontal,
  History,
  AlertCircle,
  MapPin,
  Tag,
} from 'lucide-react';

export const Products: React.FC = () => {
  const { hasRole, user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 5,
    warehouseLocation: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Stock Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustData, setAdjustData] = useState({
    quantity: 1,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: '',
  });
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  // Product History Drawer State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [productLogs, setProductLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchProducts(1);
  }, [search, categoryFilter, lowStockFilter]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getProducts({
        page,
        limit: 10,
        search,
        category: categoryFilter || undefined,
        lowStock: lowStockFilter,
      });
      if (res.success) {
        setProducts(res.data || []);
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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 5,
      warehouseLocation: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: any) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      unitPrice: prod.unitPrice,
      currentStock: prod.currentStock,
      minStockAlert: prod.minStockAlert,
      warehouseLocation: prod.warehouseLocation,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openAdjustModal = (prod: any) => {
    setSelectedProduct(prod);
    setAdjustData({
      quantity: 1,
      movementType: 'IN',
      reason: '',
    });
    setAdjustError(null);
    setAdjustModalOpen(true);
  };

  const openHistoryModal = async (prod: any) => {
    setSelectedProduct(prod);
    setHistoryModalOpen(true);
    setLoadingLogs(true);
    try {
      const res = await api.getStockLogs({ productId: prod.id, limit: 30 });
      if (res.success) {
        setProductLogs(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          unitPrice: Number(formData.unitPrice),
          minStockAlert: Number(formData.minStockAlert),
          warehouseLocation: formData.warehouseLocation,
        });
      } else {
        await api.createProduct({
          ...formData,
          unitPrice: Number(formData.unitPrice),
          currentStock: Number(formData.currentStock),
          minStockAlert: Number(formData.minStockAlert),
        });
      }
      setIsModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      setFormError(err.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setAdjustError(null);
    setAdjusting(true);
    try {
      await api.adjustStock(selectedProduct.id, {
        quantity: Number(adjustData.quantity),
        movementType: adjustData.movementType,
        reason: adjustData.reason,
      });
      setAdjustModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Product & Inventory Management</h1>
          <p>Real-time SKU catalog, stock levels, threshold alerts & warehouse bays.</p>
        </div>

        {hasRole('WAREHOUSE') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by product name, SKU, category, bay location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Category Filter */}
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Product Categories</option>
            <option value="Power Tools">Power Tools</option>
            <option value="Fasteners">Fasteners</option>
            <option value="Safety Equipment">Safety Equipment</option>
            <option value="Electrical">Electrical</option>
            <option value="Measuring Instruments">Measuring Instruments</option>
          </select>

          {/* Low Stock Toggle */}
          <button
            className={`btn ${lowStockFilter ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            onClick={() => setLowStockFilter(!lowStockFilter)}
            style={{ whiteSpace: 'nowrap' }}
          >
            <AlertTriangle size={15} />
            {lowStockFilter ? 'Showing Low Stock Only' : 'Filter Low Stock Alerts'}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Product Name & SKU</th>
              <th>Category</th>
              <th>Unit Price (INR)</th>
              <th>Current Stock</th>
              <th>Min Alert Qty</th>
              <th>Warehouse Bay</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="loading-spinner" />
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Loading inventory records...</div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((prod) => {
                const isLowStock = prod.currentStock <= prod.minStockAlert;
                return (
                  <tr key={prod.id} style={{ background: isLowStock ? 'rgba(239, 68, 68, 0.03)' : undefined }}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-light)' }}>
                        {prod.sku}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-role" style={{ fontSize: '0.72rem' }}>
                        <Tag size={10} /> {prod.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{Number(prod.unitPrice).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: isLowStock ? '#f87171' : 'var(--text-primary)',
                          }}
                        >
                          {prod.currentStock} units
                        </span>
                        {isLowStock && <span className="stock-alert-pill">LOW STOCK</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Alert at ≤ {prod.minStockAlert}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                        <MapPin size={13} color="var(--accent-primary)" />
                        {prod.warehouseLocation}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {hasRole('WAREHOUSE') && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openAdjustModal(prod)}
                            title="Adjust Stock Quantity (IN / OUT)"
                          >
                            <SlidersHorizontal size={13} /> Adjust
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openHistoryModal(prod)}
                          title="View Stock Movement Audit History"
                        >
                          <History size={13} /> Logs
                        </button>
                        {hasRole('WAREHOUSE') && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditModal(prod)}
                            title="Edit Product Info"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchProducts(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchProducts(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product Catalog' : 'Add New Inventory SKU'}
        maxWidth="600px"
      >
        {formError && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Title / Description *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Industrial Heavy Duty Drill 850W"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">SKU / Code *</label>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. TOOL-DRL-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Power Tools"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Unit Price (INR) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            {!editingProduct && (
              <div className="form-group">
                <label className="form-label">Initial Stock *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Min Stock Alert Qty *</label>
              <input
                type="number"
                className="form-input"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value, 10) || 0 })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Warehouse Bay / Location *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Bay A-03, Rack 2"
              value={formData.warehouseLocation}
              onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Stock Adjustment Dialog */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
        maxWidth="500px"
      >
        {adjustError && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{adjustError}</span>
          </div>
        )}

        <div
          style={{
            background: 'var(--bg-main)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CURRENT INVENTORY</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedProduct?.currentStock} units</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU CODE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{selectedProduct?.sku}</div>
          </div>
        </div>

        <form onSubmit={handleAdjustSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Movement Type *</label>
              <select
                className="form-select"
                value={adjustData.movementType}
                onChange={(e) => setAdjustData({ ...adjustData, movementType: e.target.value as 'IN' | 'OUT' })}
              >
                <option value="IN">IN (Stock Intake / Restock)</option>
                <option value="OUT">OUT (Damaged / Removal)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity Changed *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={adjustData.quantity}
                onChange={(e) => setAdjustData({ ...adjustData, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Justification (Mandatory for Audit) *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Supplier Batch #B-914 Received, or Quality Inspection Defect"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={adjusting}>
              {adjusting ? 'Updating Stock...' : 'Confirm Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Stock Movement Logs: ${selectedProduct?.name}`}
        maxWidth="680px"
      >
        {loadingLogs ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="loading-spinner" />
          </div>
        ) : productLogs.length === 0 ? (
          <div className="empty-state">No movement logs recorded for this SKU.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '400px', overflowY: 'auto' }}>
            {productLogs.map((log) => (
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
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.reason}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Recorded by: {log.createdBy} • {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: log.movementType === 'IN' ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {log.movementType === 'IN' ? `+${log.quantity}` : `-${log.quantity}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
