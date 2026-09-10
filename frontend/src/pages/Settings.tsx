import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import {
  Settings as SettingsIcon,
  Building2,
  Sliders,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  FileText,
  Package,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  // Company Profile Settings
  const [companyName, setCompanyName] = useState('Nexora Operations & Distribution Pvt Ltd');
  const [gstin, setGstin] = useState('27AABCF1234F1Z8');
  const [email, setEmail] = useState('billing@nexora.com');
  const [phone, setPhone] = useState('+91 22 4000 8888');
  const [address, setAddress] = useState('Central Distribution Bay A-01, Industrial Corridor, Mumbai, Maharashtra 400072');

  // Operational Policies
  const [challanPrefix, setChallanPrefix] = useState('CH-');
  const [defaultDueDays, setDefaultDueDays] = useState('14');
  const [autoDeductStock, setAutoDeductStock] = useState(true);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [emailLowStockAlerts, setEmailLowStockAlerts] = useState(true);

  // Departmental Preferences (Non-Admin & Personal)
  const [defaultBay, setDefaultBay] = useState('Bay A-01');
  const [defaultCustomerType, setDefaultCustomerType] = useState('Wholesale');
  const [invoiceTaxMode, setInvoiceTaxMode] = useState('Inclusive (GST 18%)');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <SettingsIcon size={26} color="var(--primary-blue)" /> Platform & Operational Settings
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            Configure enterprise company credentials, dispatch policies, and departmental preferences.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge type="role" value={user?.role || ''} />
          {!isAdmin && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (Departmental Preferences Mode)
            </span>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div
          style={{
            background: 'var(--success-bg)',
            color: 'var(--success)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CheckCircle2 size={18} /> Configuration parameters updated and saved successfully!
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Enterprise Company Profile */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="var(--primary-blue)" /> Company Legal Identity & Billing Header
            </h3>
            {!isAdmin && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={13} /> Admin Authorization Required to Edit
              </span>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Company Legal Name</label>
              <input
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={!isAdmin}
                style={!isAdmin ? { background: '#f8fafc', color: 'var(--text-muted)' } : undefined}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">GSTIN / Tax Identification</label>
              <input
                type="text"
                className="form-input"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                disabled={!isAdmin}
                style={!isAdmin ? { background: '#f8fafc', color: 'var(--text-muted)' } : undefined}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Official Billing Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isAdmin}
                style={!isAdmin ? { background: '#f8fafc', color: 'var(--text-muted)' } : undefined}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Direct Customer Service Helpline</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isAdmin}
                style={!isAdmin ? { background: '#f8fafc', color: 'var(--text-muted)' } : undefined}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Central Distribution & Delivery Address</label>
            <textarea
              className="form-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isAdmin}
              style={!isAdmin ? { background: '#f8fafc', color: 'var(--text-muted)' } : undefined}
              required
            />
          </div>
        </div>

        {/* Operational & Stock Enforcement Policies */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="var(--primary-blue)" /> Inventory & Sales Challan Business Rules
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Challan Numbering Prefix</label>
              <input
                type="text"
                className="form-input"
                value={challanPrefix}
                onChange={(e) => setChallanPrefix(e.target.value)}
                disabled={!isAdmin}
                style={!isAdmin ? { background: '#f8fafc', color: 'var(--text-muted)' } : undefined}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Format: {challanPrefix}YYYYMMDD-XXXX (Sequential auto-increment)
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Default Invoice Payment Term (Days)</label>
              <select
                className="form-select"
                value={defaultDueDays}
                onChange={(e) => setDefaultDueDays(e.target.value)}
                disabled={!isAdmin}
                style={!isAdmin ? { background: '#f8fafc', color: 'var(--text-muted)' } : undefined}
              >
                <option value="0">Due on Receipt (Cash on Delivery)</option>
                <option value="7">Net 7 Days</option>
                <option value="14">Net 14 Days (Standard)</option>
                <option value="30">Net 30 Days (Distributor Credit)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
            {/* Rule 1: Atomic Stock Deduction */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: isAdmin ? 'pointer' : 'default' }}>
              <input
                type="checkbox"
                checked={autoDeductStock}
                onChange={(e) => isAdmin && setAutoDeductStock(e.target.checked)}
                disabled={!isAdmin}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-blue)' }}
              />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                  Atomic Stock Deduction on Challan Confirmation
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Automatically deducts items from warehouse inventory and creates immutable OUT audit logs when confirmed.
                </p>
              </div>
            </label>

            {/* Rule 2: Negative Stock Prevention */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'not-allowed' }}>
              <input
                type="checkbox"
                checked={!allowNegativeStock}
                disabled
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-blue)' }}
              />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                  Strict Negative Stock Prevention (Always Enforced)
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Transactions automatically abort and return HTTP 400 Bad Request if requested quantity exceeds available inventory.
                </p>
              </div>
            </label>

            {/* Rule 3: Low-stock Notifications */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailLowStockAlerts}
                onChange={(e) => setEmailLowStockAlerts(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-blue)' }}
              />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                  Real-time Dashboard & Notification Stream Alerts
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Highlight products with pulsating low stock badges whenever current stock drops below the SKU alert threshold.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Departmental & Role Custom Preferences */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="var(--primary-blue)" /> Departmental & Regional Preferences
          </h3>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Primary Operational Warehouse Bay</label>
              <select
                className="form-select"
                value={defaultBay}
                onChange={(e) => setDefaultBay(e.target.value)}
              >
                <option value="Bay A-01">Bay A-01 (General Machinery)</option>
                <option value="Bay B-04">Bay B-04 (Safety & Fasteners)</option>
                <option value="Bay C-02">Bay C-02 (Heavy Commercial Tools)</option>
                <option value="Bay D-03">Bay D-03 (Electrical Equipment)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default New Account Type</label>
              <select
                className="form-select"
                value={defaultCustomerType}
                onChange={(e) => setDefaultCustomerType(e.target.value)}
              >
                <option value="Wholesale">Wholesale Commercial</option>
                <option value="Distributor">Authorized Distributor</option>
                <option value="Retail">Commercial Retail</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tax Specification</label>
              <select
                className="form-select"
                value={invoiceTaxMode}
                onChange={(e) => setInvoiceTaxMode(e.target.value)}
              >
                <option value="Inclusive (GST 18%)">GST 18% (Standard Rate)</option>
                <option value="Exempt">Zero Rated / SEZ Export</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Settings apply across the entire Nexora Platform instance.
          </span>
          <button type="submit" className="btn btn-primary">
            <Save size={16} /> Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
};
