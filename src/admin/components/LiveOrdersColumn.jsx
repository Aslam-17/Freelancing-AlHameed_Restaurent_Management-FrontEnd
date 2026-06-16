// admin/src/components/LiveOrdersColumn.jsx
// ─────────────────────────────────────────────────────────────
// Right-hand column on the Dashboard. Polls active orders
// every 20 seconds and displays compact cards.
// Props: onCountChange — (n) => void
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { ordersApi } from '../api/index.js';

const POLL = 20_000; // 20 seconds

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0);

const timeAgo = (str) => {
  const s = Math.floor((Date.now() - new Date(str).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

export default function LiveOrdersColumn({ onCountChange }) {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const timer = useRef(null);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError('');
    try {
      const res = await ordersApi.getActive();
      const data = res.data ?? [];
      setOrders(data);
      onCountChange?.(data.length);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetch();
    timer.current = setInterval(() => fetch(true), POLL);
    return () => clearInterval(timer.current);
  }, [fetch]);

  return (
    <div className="panel" style={{ position: 'sticky', top: '1.5rem' }}>
      <div className="panel__header">
        <span className="panel__title">
          🔴 Live Orders
          {orders.length > 0 && (
            <span className="badge badge-accent">{orders.length}</span>
          )}
        </span>
        <button
          className={`btn-icon ${refreshing ? 'spinning' : ''}`}
          onClick={() => fetch()}
          title="Refresh"
          disabled={refreshing}
        >
          ↺
        </button>
      </div>

      <div className="panel__body--no-pad" style={{ maxHeight: 600, overflowY: 'auto' }}>
        {loading ? (
          <div className="loading-center"><span className="spinner dark" /><span>Loading…</span></div>
        ) : error ? (
          <div className="alert alert-error" style={{ margin: '1rem' }}>
            <span className="alert-icon">⚠️</span>{error}
          </div>
        ) : orders.length === 0 ? (
          <div className="loading-center" style={{ minHeight: 180 }}>
            <span style={{ fontSize: '2rem', opacity: .4 }}>🎉</span>
            <span className="text-dim">No active orders</span>
          </div>
        ) : (
          <div className="live-col" style={{ padding: '1rem' }}>
            {orders.map((o) => {
              const tableLabel = o.tableId?.name || `T${o.tableId?.tableNumber ?? '?'}`;
              const tableNum   = o.tableId?.tableNumber ?? '?';
              const subtotal   = (o.items ?? []).reduce(
                (s, it) => s + it.priceAtTimeOfOrder * it.quantity, 0
              );
              return (
                <div className="live-order-card" key={o._id}>
                  <div className="live-order-card__top">
                    <div className="live-order-card__table">
                      <div className="live-order-card__table-badge">
                        {tableNum}
                      </div>
                      <div className="live-order-card__table-name">
                        {tableLabel}
                        {o.tableId?.zone && (
                          <span
                            className={`zone-pill ${o.tableId.zone === 'AC' ? 'ac' : 'non-ac'}`}
                            style={{ marginLeft: '.4rem' }}
                          >
                            {o.tableId.zone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="live-order-card__total">{fmt(subtotal)}</div>
                  </div>

                  <div className="live-order-card__meta">
                    <span className="live-order-card__customer">👤 {o.customerName}</span>
                    <span className="live-order-card__time">🕐 {timeAgo(o.createdAt)}</span>
                  </div>

                  {o.waiterId?.username && (
                    <div className="live-order-card__waiter">
                      Waiter: @{o.waiterId.username} · {(o.items ?? []).length} item(s)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        padding: '.5rem 1rem',
        borderTop: '1px solid var(--border)',
        fontSize: '.65rem',
        color: 'var(--text-dim)',
        textAlign: 'center',
      }}>
        Refreshes every 20s
      </div>
    </div>
  );
}
