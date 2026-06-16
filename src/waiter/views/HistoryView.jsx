// src/views/HistoryView.jsx
// ─────────────────────────────────────────────────────────────
// Today's Completed Orders — shows all bills completed today
// with a live search bar.  Data is fetched from GET /bills/today.
// Bills auto-expire after 7 days (MongoDB TTL on the Bill model).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { billsApi } from '../api/index.js';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

function timeLabel(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function HistoryView() {
  const [bills,     setBills]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef(null);

  // ── Fetch bills (optionally with search) ─────────────────
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

  // Initial load
  useEffect(() => { fetchBills(); }, [fetchBills]);

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val);
    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchBills(val), 400);
  };

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner dark" />
        <span>Loading today's orders…</span>
      </div>
    );
  }

  return (
    <div className="history-view">
      {/* ── Header ── */}
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
          <span className="history-header__title">Today's Orders</span>
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

      {/* ── Search bar ── */}
      <div style={{ padding: '0 var(--s-4) var(--s-3)' }}>
        <div className="search-bar" style={{ position: 'relative' }}>
          <span className="search-bar__icon">🔍</span>
          <input
            className="search-input"
            type="search"
            placeholder="Search by customer name…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search orders"
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
            const tableLabel = bill.tableId
              ? (bill.tableId.name || `Table ${bill.tableId.tableNumber}`)
              : 'Unknown Table';
            const subtotal = (bill.items ?? []).reduce(
              (s, item) => s + item.priceAtTimeOfOrder * item.quantity, 0
            );
            return (
              <article key={bill._id} className="history-card">
                {/* Card header */}
                <div className="history-card__header">
                  <div className="history-card__table-badge">
                    {bill.tableId?.tableNumber ? <>T<br />{bill.tableId.tableNumber}</> : '?'}
                  </div>
                  <div className="history-card__meta">
                    <div className="history-card__customer">{bill.customerName}</div>
                    {bill.customerPhone && (
                      <div className="history-card__phone">📞 {bill.customerPhone}</div>
                    )}
                    <div className="history-card__info">
                      <span>{tableLabel}</span>
                      <span>·</span>
                      <span>🕐 {timeLabel(bill.createdAt)}</span>
                      {bill.waiterId?.username && (
                        <><span>·</span><span>@{bill.waiterId.username}</span></>
                      )}
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
        textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-dim)',
        padding: 'var(--s-3)', paddingBottom: 'calc(var(--s-3) + env(safe-area-inset-bottom))',
      }}>
        Today's orders only · Auto-cleared at midnight
      </div>
    </div>
  );
}
