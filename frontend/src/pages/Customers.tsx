import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  Edit2,
  AlertCircle,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { hasRole, user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Detail Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'Retail',
    address: '',
    status: 'Lead',
    followUpDate: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Follow-up Note state
  const [newNote, setNewNote] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchCustomers(1);
  }, [search, statusFilter, typeFilter]);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getCustomers({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
      });
      if (res.success) {
        setCustomers(res.data || []);
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

  const openDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const res = await api.getCustomerById(id);
      if (res.success) {
        setCustomerDetail(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'Retail',
      address: '',
      status: 'Lead',
      followUpDate: '',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cust: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      mobile: cust.mobile,
      email: cust.email,
      businessName: cust.businessName,
      gstNumber: cust.gstNumber || '',
      customerType: cust.customerType,
      address: cust.address,
      status: cust.status,
      followUpDate: cust.followUpDate ? new Date(cust.followUpDate).toISOString().slice(0, 10) : '',
      notes: cust.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
      } else {
        await api.createCustomer(formData);
      }
      setIsModalOpen(false);
      fetchCustomers(pagination.page);
      if (selectedCustomerId) {
        openDetail(selectedCustomerId);
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Check input fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCustomerId) return;
    setAddingNote(true);
    try {
      await api.addFollowUpNote(selectedCustomerId, {
        note: newNote,
        nextFollowUpDate: nextFollowUp || null,
      });
      setNewNote('');
      setNextFollowUp('');
      await openDetail(selectedCustomerId);
      fetchCustomers(pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Customer CRM</h1>
          <p>Manage retail, wholesale, and distributor accounts, follow-ups & contracts.</p>
        </div>

        {hasRole('SALES') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by customer name, business, email, mobile, GST..."
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
            <option value="">All Statuses (Lead, Active, Inactive)</option>
            <option value="Active">Active</option>
            <option value="Lead">Lead</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Type Filter */}
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Customer Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Customer / Contact</th>
              <th>Business Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Follow-up Date</th>
              <th>Activity</th>
              {hasRole('SALES') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <span className="loading-spinner" />
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Loading customers...</div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No customers found matching your filters.
                </td>
              </tr>
            ) : (
              customers.map((cust) => (
                <tr
                  key={cust.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openDetail(cust.id)}
                >
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cust.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.mobile}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{cust.businessName}</div>
                    {cust.gstNumber && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GST: {cust.gstNumber}</div>
                    )}
                  </td>
                  <td>
                    <Badge type="customerType" value={cust.customerType} />
                  </td>
                  <td>
                    <Badge type="status" value={cust.status} />
                  </td>
                  <td>
                    {cust.followUpDate ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                        <Calendar size={13} color="var(--warning)" />
                        {new Date(cust.followUpDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None scheduled</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {cust._count?.challans || 0} Challans • {cust._count?.followUpLogs || 0} Notes
                    </div>
                  </td>
                  {hasRole('SALES') && (
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => openEditModal(cust, e)}
                        title="Edit Customer"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  )}
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
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total customers)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchCustomers(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchCustomers(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Customer Detail Modal / Drawer */}
      <Modal
        isOpen={!!selectedCustomerId}
        onClose={() => {
          setSelectedCustomerId(null);
          setCustomerDetail(null);
        }}
        title="Customer Profile & Follow-up History"
        maxWidth="750px"
      >
        {loadingDetail || !customerDetail ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="loading-spinner" />
          </div>
        ) : (
          <div>
            {/* Overview Card */}
            <div
              style={{
                background: 'var(--bg-main)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>{customerDetail.name}</h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                    {customerDetail.businessName}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Badge type="customerType" value={customerDetail.customerType} />
                  <Badge type="status" value={customerDetail.status} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Phone size={14} color="var(--accent-primary)" /> {customerDetail.mobile}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Mail size={14} color="var(--accent-primary)" /> {customerDetail.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Building2 size={14} color="var(--accent-primary)" /> GST: {customerDetail.gstNumber || 'Not Registered'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} color="var(--warning)" /> Follow-up:{' '}
                  {customerDetail.followUpDate ? new Date(customerDetail.followUpDate).toLocaleDateString() : 'None'}
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                <strong>Address:</strong> {customerDetail.address}
              </div>
            </div>

            {/* Follow-up Notes Timeline */}
            <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={16} color="var(--accent-primary)" /> Follow-up Timeline & Notes
            </h4>

            {/* Add New Note Box */}
            {hasRole('SALES') && (
              <form
                onSubmit={handleAddNote}
                style={{
                  background: 'var(--bg-main)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1rem',
                }}
              >
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <textarea
                    className="form-textarea"
                    placeholder="Type follow-up notes, call log, discussion points..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Next Follow-up Date:</span>
                    <input
                      type="date"
                      className="form-input"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                      value={nextFollowUp}
                      onChange={(e) => setNextFollowUp(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={addingNote || !newNote.trim()}>
                    {addingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </form>
            )}

            {/* Timeline List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto' }}>
              {customerDetail.followUpLogs?.length > 0 ? (
                customerDetail.followUpLogs.map((log: any) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderLeft: '3px solid var(--accent-primary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{log.createdBy}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {log.note}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '1rem' }}>
                  No follow-up notes logged yet.
                </div>
              )}
            </div>

            {/* Associated Challans */}
            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} color="var(--info)" /> Challan History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {customerDetail.challans?.length > 0 ? (
                customerDetail.challans.map((ch: any) => (
                  <div
                    key={ch.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-main)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <strong>{ch.challanNumber}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span>₹{Number(ch.totalAmount).toLocaleString('en-IN')}</span>
                      <Badge type="status" value={ch.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No challans recorded for this customer.</div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Information' : 'Add New B2B Customer'}
        maxWidth="620px"
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
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Customer / Contact Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rajesh Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business / Firm Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sharma Building Supplies"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 98201 12345"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="rajesh@sharmatraders.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Customer Type *</label>
              <select
                className="form-select"
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">GST Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="27AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address / Delivery Location *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Plot 45, GIDC Industrial Area, Mumbai, MH"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Follow-up Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            />
          </div>

          {!editingCustomer && (
            <div className="form-group">
              <label className="form-label">Initial Notes / Context</label>
              <textarea
                className="form-textarea"
                placeholder="Notes on client requirements, payment terms, or lead origin..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          )}

          <div className="modal-footer" style={{ padding: '1rem 0 0 0' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
