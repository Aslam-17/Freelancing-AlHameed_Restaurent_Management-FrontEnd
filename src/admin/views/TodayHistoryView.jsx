// admin/src/views/TodayHistoryView.jsx
// ─────────────────────────────────────────────────────────────
// Today's completed orders — admin desktop view.
// Reuses the shared BillsTable component with live search.
// Data source: GET /api/bills/today?search=<text>
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { billsApi } from '../api/index.js';
import BillsTable from '../components/BillsTable.jsx';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0);

export default function TodayHistoryView() {
  const [bills,   setBills]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const debounce = useRef(null);

  const fetchBills = useCallback(async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await billsApi.getToday(query);
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

  // Summary stats
  const totalRev   = bills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const totalItems = bills.reduce((s, b) => s + (b.items ?? []).reduce((q, i) => q + i.quantity, 0), 0);

  return (
    <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <div className="page-header__breadcrumb">Admin › Today's History</div>
          <div className="page-header__title">Today's Completed Orders</div>
        </div>
        <div className="page-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!loading && bills.length > 0 && (
            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
              {bills.length} order{bills.length !== 1 ? 's' : ''} ·{' '}
              {totalItems} item{totalItems !== 1 ? 's' : ''} ·{' '}
              <span className="text-accent">{fmt(totalRev)}</span>
            </span>
          )}
          <button
            className="btn-icon"
            onClick={() => fetchBills(search)}
            title="Refresh"
            aria-label="Refresh today's orders"
          >↺</button>
        </div>
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Info banner ── */}
        <div
          className="alert"
          style={{
            background: 'var(--success-dim)',
            border: '1px solid rgba(34,197,94,.2)',
            color: 'rgba(187,247,208,.8)',
            marginBottom: '1.25rem',
            gap: '.6rem',
            padding: '.75rem 1rem',
          }}
        >
          <span>📅</span>
          Showing orders completed <strong>today</strong> only. Resets automatically at midnight.
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span className="alert-icon">⚠️</span>{error}
          </div>
        )}

        {/* ── Search + clear ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="search-bar-admin">
            <span className="search-bar-admin__icon">🔍</span>
            <input
              id="today-history-search"
              className="search-input-admin"
              type="search"
              placeholder="Search by customer name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search today's orders by customer name"
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

        {/* ── Table (reuses BillsTable) ── */}
        <BillsTable bills={bills} loading={loading} showDetailedItems={true} />

        {/* ── Revenue footer ── */}
        {!loading && bills.length > 0 && (
          <div style={{
            marginTop: '1.25rem', padding: '1rem 1.25rem',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', display: 'flex', gap: '2rem', flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Orders Today</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{bills.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Items Sold</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{totalItems}</div>
            </div>
            <div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Total Revenue</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{fmt(totalRev)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
