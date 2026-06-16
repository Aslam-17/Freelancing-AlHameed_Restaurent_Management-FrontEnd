// admin/src/views/SalesView.jsx
// ─────────────────────────────────────────────────────────────
// Food Sales Analytics — shows how many units of each menu item
// were sold for: Today / This Month / This Year.
// Data comes from GET /api/bills/item-sales?period=today|month|year
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { billsApi } from '../api/index.js';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
];

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

export default function SalesView() {
  const [period,    setPeriod]    = useState('today');
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');

  const fetchSales = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      const res = await billsApi.getItemSales(p);
      setRows(res.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(period); }, [period, fetchSales]);

  // ── Filtered rows by search ───────────────────────────────
  const filtered = search.trim()
    ? rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.category?.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  const grandQty = rows.reduce((s, r) => s + r.totalQty, 0);
  const grandRev = rows.reduce((s, r) => s + r.totalRev, 0);

  return (
    <div className="view-page">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">📈 Food Sales</h2>
          <p className="page-sub">Units sold per menu item — filtered by period</p>
        </div>
        <button
          className="btn-icon"
          onClick={() => fetchSales(period)}
          title="Refresh"
          aria-label="Refresh sales data"
        >↺</button>
      </div>

      {/* ── Period tabs ── */}
      <div className="sales-period-tabs">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            id={`sales-period-${key}`}
            className={`sales-period-tab ${period === key ? 'is-active' : ''}`}
            onClick={() => { setPeriod(key); setSearch(''); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Summary chips ── */}
      {!loading && rows.length > 0 && (
        <div className="sales-summary">
          <div className="sales-summary-chip">
            <span className="sales-summary-chip__label">Total Items Sold</span>
            <span className="sales-summary-chip__value">{grandQty.toLocaleString()}</span>
          </div>
          <div className="sales-summary-chip">
            <span className="sales-summary-chip__label">Total Revenue</span>
            <span className="sales-summary-chip__value" style={{ color: 'var(--accent)' }}>
              {formatCurrency(grandRev)}
            </span>
          </div>
          <div className="sales-summary-chip">
            <span className="sales-summary-chip__label">Unique Items</span>
            <span className="sales-summary-chip__value">{rows.length}</span>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="search-bar-admin" style={{ marginBottom: '1.25rem', maxWidth: '100%' }}>
        <span className="search-bar-admin__icon">🔍</span>
        <input
          id="sales-search"
          className="search-input-admin"
          type="search"
          placeholder="Search item name or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <span className="alert-icon">⚠️</span>{error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', padding: '2rem 0' }}>
          <span className="spinner dark" />
          <span>Loading sales data…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="sales-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{search ? '🔍' : '📊'}</div>
          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
            {search ? 'No matching items' : `No sales data for ${PERIODS.find(p => p.key === period)?.label}`}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
            {search ? 'Try a different search.' : 'Complete some orders and they will appear here.'}
          </div>
        </div>
      ) : (
        /* ── Sales table ── */
        <div className="sales-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Item Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Units Sold</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const barWidth = grandQty > 0 ? Math.round((row.totalQty / rows[0].totalQty) * 100) : 0;
                return (
                  <tr key={row.itemId ?? idx}>
                    <td style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{row.name}</div>
                      {/* Mini bar chart */}
                      <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden', maxWidth: 200 }}>
                        <div style={{
                          height: '100%', width: `${barWidth}%`,
                          background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                          borderRadius: 2, transition: 'width 600ms ease',
                        }} />
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{row.category || '—'}</span>
                    </td>
                    <td className="td-amount" style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {formatCurrency(row.price ?? 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block', minWidth: 40, textAlign: 'center',
                        padding: '3px 10px', borderRadius: 'var(--r-full)',
                        background: 'var(--accent-dim)', color: 'var(--accent)',
                        fontWeight: 800, fontSize: '0.95rem',
                      }}>
                        {row.totalQty}
                      </span>
                    </td>
                    <td className="td-amount" style={{ textAlign: 'right' }}>
                      {formatCurrency(row.totalRev)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals footer */}
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td colSpan={4} style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Showing {filtered.length} of {rows.length} items
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem' }}>
                  {filtered.reduce((s, r) => s + r.totalQty, 0)}
                </td>
                <td className="td-amount" style={{ textAlign: 'right' }}>
                  {formatCurrency(filtered.reduce((s, r) => s + r.totalRev, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
