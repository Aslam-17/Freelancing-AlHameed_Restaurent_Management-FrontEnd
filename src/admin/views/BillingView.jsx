// admin/src/views/BillingView.jsx
// ─────────────────────────────────────────────────────────────
// Historical bill archive with live customer-name search.
// Backend TTL ensures only last 7 days of records exist.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { billsApi } from '../api/index.js';
import BillsTable from '../components/BillsTable.jsx';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0);

export default function BillingView() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Debounce timer
  const debounce = useRef(null);

  const fetchBills = useCallback(async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await billsApi.getHistory(query || undefined);
      setBills(res.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchBills(); }, [fetchBills]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchBills(search), 400);
    return () => clearTimeout(debounce.current);
  }, [search, fetchBills]);

  const handleDeleteBill = async (id) => {
    try {
      await billsApi.delete(id);
      setBills(prev => prev.filter(b => b._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  // Summary stats from the loaded bills
  const totalRev = bills.reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header__breadcrumb">Admin › Billing</div>
          <div className="page-header__title">Billing Archive</div>
        </div>
        <div className="page-header__actions">
          {!loading && bills.length > 0 && (
            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
              {bills.length} record{bills.length !== 1 ? 's' : ''} ·{' '}
              <span className="text-accent">{fmt(totalRev)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span className="alert-icon">⚠️</span>{error}
          </div>
        )}

        {/* Info note */}
        <div
          className="alert"
          style={{
            background: 'var(--info-dim)',
            border: '1px solid rgba(56,189,248,.2)',
            color: 'rgba(186,230,253,.8)',
            marginBottom: '1.25rem',
            gap: '.6rem',
            padding: '.75rem 1rem',
          }}
        >
          <span>ℹ️</span>
          Bills are automatically purged after <strong>7 days</strong> . Only recent records appear here.
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="search-bar-admin">
            <span className="search-bar-admin__icon">🔍</span>
            <input
              className="search-input-admin"
              type="search"
              placeholder="Search by customer name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search bills by customer name"
            />
          </div>

          {search && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSearch('')}
            >
              ✕ Clear
            </button>
          )}

          {!loading && search && (
            <span className="text-dim">
              {bills.length} result{bills.length !== 1 ? 's' : ''} for "{search}"
            </span>
          )}
        </div>

        {/* Bills table */}
        <BillsTable bills={bills} loading={loading} onDeleteBill={handleDeleteBill} />
      </div>
    </div>
  );
}
