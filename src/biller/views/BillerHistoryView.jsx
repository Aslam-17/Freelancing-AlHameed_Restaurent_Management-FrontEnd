// src/biller/views/BillerHistoryView.jsx
// ─────────────────────────────────────────────────────────────
// Biller Past Orders — today's completed bills with Takeaway /
// Dine-in badge, search, and a running total summary.
// Reuses the same GET /api/bills/today endpoint as HistoryView.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { billsApi } from '../../waiter/api/index.js';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

function timeLabel(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ── Order-type pill ───────────────────────────────────────────
function TypeBadge({ type }) {
  const isTakeaway = type === 'Takeaway';
  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '3px',
        padding:      '2px 8px',
        borderRadius: '99px',
        fontSize:     '0.7rem',
        fontWeight:   700,
        background:   isTakeaway ? 'rgba(251,146,60,.15)' : 'rgba(34,197,94,.12)',
        border:       `1px solid ${isTakeaway ? 'rgba(251,146,60,.4)' : 'rgba(34,197,94,.3)'}`,
        color:        isTakeaway ? '#fb923c' : '#4ade80',
      }}
    >
      {isTakeaway ? '🛵 Takeaway' : '🪑 Dine-in'}
    </span>
  );
}

export default function BillerHistoryView() {
  const [bills,     setBills]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef(null);

  const fetchBills = useCallback(async (searchVal = '') => {
    setError('');
    try {
      const res = await billsApi.getToday(searchVal);
      setBills(res.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleSearch = (val) => {
    setSearch(val);
    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchBills(val), 400);
  };

  // ── Totals summary ────────────────────────────────────────
  const summary = bills.reduce(
    (acc, b) => {
      acc.total += b.totalAmount || 0;
      if (b.orderType === 'Takeaway') acc.takeaway += 1;
      else acc.dinein += 1;
      return acc;
    },
    { total: 0, takeaway: 0, dinein: 0 }
  );

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner dark" />
        <span>Loading past orders…</span>
      </div>
    );
  }

  return (
    <div className="history-view">
      {/* ── Header ── */}
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
          <span className="history-header__title">Past Orders</span>
          {bills.length > 0 && (
            <span className="orders-header__count">{bills.length}</span>
          )}
        </div>
        <button
          className="btn-refresh"
          onClick={() => { setLoading(true); fetchBills(search); }}
          aria-label="Refresh"
        >↺</button>
      </div>

      {/* ── Summary strip ── */}
      {bills.length > 0 && (
        <div
          style={{
            display:        'flex',
            gap:            'var(--s-3)',
            padding:        '0 var(--s-4) var(--s-3)',
            flexWrap:       'wrap',
          }}
        >
          {[
            { label: 'Revenue',  value: formatCurrency(summary.total), color: 'var(--accent)' },
            { label: 'Dine-in',  value: summary.dinein,                color: '#4ade80' },
            { label: 'Takeaway', value: summary.takeaway,              color: '#fb923c' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex:           1,
                minWidth:       80,
                background:     'var(--surface-2)',
                border:         '1px solid var(--border)',
                borderRadius:   'var(--r-lg)',
                padding:        'var(--s-2) var(--s-3)',
                textAlign:      'center',
              }}
            >
              <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search ── */}
      <div style={{ padding: '0 var(--s-4) var(--s-3)' }}>
        <div className="search-bar" style={{ position: 'relative' }}>
          <span className="search-bar__icon">🔍</span>
          <input
            className="search-input"
            type="search"
            placeholder="Search by customer name…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search past orders"
          />
          {searching && (
            <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
              <span className="spinner dark" style={{ width: 14, height: 14, borderWidth: 2 }} />
            </span>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-error" style={{ margin: '0 var(--s-4) var(--s-3)' }}>
          <span className="alert-icon">⚠️</span>{error}
        </div>
      )}

      {/* ── Bills list / empty state ── */}
      {bills.length === 0 && !error ? (
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state__icon">{search ? '🔍' : '📭'}</div>
          <div className="empty-state__title">
            {search ? 'No matching orders' : 'No completed orders yet today'}
          </div>
          <div className="empty-state__text">
            {search ? 'Try a different name.' : 'Completed orders will appear here.'}
          </div>
        </div>
      ) : (
        <div className="history-list">
          {bills.map((bill) => {
            const isTakeaway = bill.orderType === 'Takeaway';
            const tableLabel = isTakeaway
              ? 'Takeaway'
              : bill.tableId
                ? (bill.tableId.name || `Table ${bill.tableId.tableNumber}`)
                : '—';

            const subtotal = (bill.items ?? []).reduce(
              (s, item) => s + item.priceAtTimeOfOrder * item.quantity, 0
            );

            return (
              <article key={bill._id} className="history-card">
                {/* Card header */}
                <div className="history-card__header">
                  {/* Type badge (replaces table number badge) */}
                  <div
                    className="history-card__table-badge"
                    style={isTakeaway
                      ? { background: 'rgba(251,146,60,.2)', border: '1.5px solid rgba(251,146,60,.5)', color: '#fb923c' }
                      : {}}
                  >
                    {isTakeaway
                      ? <>🛵<br />Go</>
                      : bill.tableId?.tableNumber
                        ? <>T<br />{bill.tableId.tableNumber}</>
                        : '?'}
                  </div>

                  <div className="history-card__meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
                      <div className="history-card__customer">{bill.customerName}</div>
                      <TypeBadge type={bill.orderType || 'Dine-in'} />
                    </div>
                    {bill.customerPhone && (
                      <div className="history-card__phone">📞 {bill.customerPhone}</div>
                    )}
                    <div className="history-card__info">
                      <span>{tableLabel}</span>
                      <span>·</span>
                      <span>🕐 {timeLabel(bill.createdAt)}</span>
                    </div>
                  </div>

                  <div className="history-card__total">
                    {formatCurrency(bill.totalAmount)}
                  </div>
                </div>

                {/* Items */}
                <div className="history-card__items">
                  {(bill.items ?? []).map((line, i) => {
                    const name  = line.menuItem?.name ?? 'Unknown item';
                    const price = line.priceAtTimeOfOrder ?? 0;
                    return (
                      <div key={i} className="history-card__item">
                        <span className="history-card__item-qty">{line.quantity}×</span>
                        <span className="history-card__item-name">{name}</span>
                        <span className="history-card__item-price">
                          {formatCurrency(price * line.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* GST footer */}
                <div className="history-card__footer">
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    Subtotal {formatCurrency(subtotal)}
                    {bill.gstApplied > 0 && ` + GST ₹${bill.gstApplied.toFixed(0)}`}
                  </span>
                  <span className="history-card__badge">✅ Completed</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div style={{
        textAlign:     'center',
        fontSize:      '0.7rem',
        color:         'var(--text-dim)',
        padding:       'var(--s-3)',
        paddingBottom: 'calc(var(--s-3) + env(safe-area-inset-bottom))',
      }}>
        Today's orders only · Auto-cleared at midnight
      </div>
    </div>
  );
}
