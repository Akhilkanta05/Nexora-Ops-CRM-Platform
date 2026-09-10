import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  Users2,
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
  Check,
  ChevronDown,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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

  // Follow-up Note Form
  const [newNote, setNewNote] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, typeFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({
        limit: 50,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
      });
      if (res.success && res.data) {
        setCustomers(res.data);
        if (res.data.length > 0 && !selectedCustomerId) {
          openDetail(res.data[0].id);
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
      await fetchCustomers();
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
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="master-detail-layout">
      {/* Middle Column: Customers Master List */}
      <section className="col-master" style={{ padding: '1.75rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Customers</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
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
              <option value="">All types</option>
              <option value="Distributor">Distributor</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Retail">Retail</option>
            </select>

            {hasRole('SALES') && (
              <button
                className="btn btn-primary btn-sm"
                onClick={openAddModal}
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
            All accounts ({customers.length})
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '0.8rem',
              color: 'var(--primary-blue)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="">Status: All</option>
            <option value="Active">Active</option>
            <option value="Lead">Lead</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Card Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <span className="loading-spinner" />
            </div>
          ) : customers.length === 0 ? (
            <div className="empty-state">No customers found.</div>
          ) : (
            customers.map((cust) => {
              const isSelected = selectedCustomerId === cust.id;

              let badgeClass = 'status-pill status-active';
              if (cust.status === 'Lead') badgeClass = 'status-pill status-draft';
              if (cust.status === 'Inactive') badgeClass = 'status-pill status-cancelled';

              return (
                <div
                  key={cust.id}
                  onClick={() => openDetail(cust.id)}
                  className={`feed-card ${isSelected ? 'selected' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
                        {cust.name}
                      </span>

                      <span className={badgeClass}>{cust.status}</span>
                    </div>

                    {hasRole('SALES') && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                        onClick={(e) => openEditModal(cust, e)}
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', gap: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8' }}>Business:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{cust.businessName}</span>

                    <span style={{ color: '#94a3b8' }}>Type:</span>
                    <span style={{ color: '#334155', fontWeight: 500 }}>{cust.customerType}</span>

                    <span style={{ color: '#94a3b8' }}>Contact:</span>
                    <span style={{ color: 'var(--primary-blue)', fontWeight: 500 }}>{cust.mobile}</span>

                    <span style={{ color: '#94a3b8' }}>Follow-up:</span>
                    <span style={{ color: '#64748b' }}>
                      {cust.followUpDate ? new Date(cust.followUpDate).toLocaleDateString('en-GB') : 'None'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Right Column: Customer Profile Document Sheet */}
      <main className="col-detail">
        {loadingDetail ? (
          <div style={{ textAlign: 'center', margin: 'auto' }}>
            <span className="loading-spinner" />
          </div>
        ) : customerDetail ? (
          <div className="document-sheet" key={customerDetail.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {customerDetail.businessName}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Contact: <strong style={{ color: '#0f172a' }}>{customerDetail.name}</strong> • Account Type:{' '}
                  <strong style={{ color: 'var(--primary-blue)' }}>{customerDetail.customerType}</strong>
                </div>
              </div>

              {hasRole('SALES') && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openEditModal(customerDetail)}
                >
                  <Edit2 size={13} /> Edit Account
                </button>
              )}
            </div>

            {/* Address & GST Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Account Details:</div>
                <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                  <strong>Email:</strong> {customerDetail.email}<br />
                  <strong>Phone:</strong> {customerDetail.mobile}<br />
                  <strong>GSTIN:</strong> {customerDetail.gstNumber || 'Not Registered'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Delivery Address:</div>
                <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                  {customerDetail.address}
                </div>
              </div>
            </div>

            {/* Follow-up Notes Timeline */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} color="var(--primary-blue)" /> CRM Follow-up Timeline
              </div>

              {hasRole('SALES') && (
                <form
                  onSubmit={handleAddNote}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                    <textarea
                      className="form-textarea"
                      placeholder="Add follow-up discussion points, requirements, or next steps..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748b' }}>Next Date:</span>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: '0.3rem 0.5rem', width: 'auto' }}
                        value={nextFollowUp}
                        onChange={(e) => setNextFollowUp(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={addingNote}>
                      {addingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '200px', overflowY: 'auto' }}>
                {customerDetail.followUpLogs?.length > 0 ? (
                  customerDetail.followUpLogs.map((log: any) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.75rem',
                        background: '#ffffff',
                        border: '1px solid #f1f5f9',
                        borderLeft: '3px solid var(--primary-blue)',
                        borderRadius: '6px',
                        fontSize: '0.825rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                        <span>{log.createdBy}</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ color: '#334155' }}>{log.note}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '1rem' }}>No notes logged yet.</div>
                )}
              </div>
            </div>

            {/* Associated Challans */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color="var(--primary-blue)" /> Associated Sales Challans
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {customerDetail.challans?.length > 0 ? (
                  customerDetail.challans.map((ch: any) => (
                    <div
                      key={ch.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '0.825rem',
                      }}
                    >
                      <div>
                        <strong>{ch.challanNumber}</strong>
                        <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>
                          {new Date(ch.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div>
                        <strong style={{ marginRight: '0.75rem' }}>₹{Number(ch.totalAmount).toLocaleString('en-IN')}</strong>
                        <span className={`status-pill ${ch.status === 'Confirmed' ? 'status-active' : 'status-draft'}`}>
                          {ch.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No challans recorded for this customer.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ margin: 'auto' }}>
            Select a customer account to inspect details and follow-ups.
          </div>
        )}
      </main>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        maxWidth="600px"
      >
        {formError && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contact Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Mobile *</label>
              <input
                type="tel"
                className="form-input"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Customer Type</label>
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
              <label className="form-label">Status</label>
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
              <label className="form-label">GSTIN (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address *</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
