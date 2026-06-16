// frontend/src/admin/views/LiveOrdersView.jsx
// Dedicated full-page view for live active orders.
// Polls every 15 seconds.
import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../api/index.js';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0);

const timeAgo = (str) => {
  const s = Math.floor((Date.now() - new Date(str).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

export default function LiveOrdersView() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError('');
    try {
      const res = await ordersApi.getActive();
      setOrders(res.data ?? []);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const t = setInterval(() => fetchOrders(true), 15_000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const totalRevenue = orders.reduce((s, o) =>
    s + (o.items ?? []).reduce((x, it) => x + it.priceAtTimeOfOrder * it.quantity, 0), 0);

  return (
    <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <div className="page-header__breadcrumb">Admin › Live Orders</div>
          <div className="page-header__title">🔴 Live Orders</div>
        </div>
        <div className="page-header__actions">
          {orders.length > 0 && (
            <span className="badge badge-accent">{orders.length} active</span>
          )}
          {lastUpdate && (
            <span style={{ fontSize: '.72rem', color: 'var(--text-dim)' }}>
              Updated {timeAgo(lastUpdate.toISOString())}
            </span>
          )}
          <button
            className={`btn-icon ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchOrders()}
            title="Refresh"
          >↺</button>
        </div>
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span className="alert-icon">⚠️</span>{error}
          </div>
        )}

        {/* Summary bar */}
        {!loading && orders.length > 0 && (
          <div style={{
            display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap',
          }}>
            <div className="panel" style={{ flex: 1, minWidth: 180, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem' }}>Active Tables</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.04em' }}>{orders.length}</div>
            </div>
            <div className="panel" style={{ flex: 1, minWidth: 180, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem' }}>Total in Orders</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-.04em' }}>{fmt(totalRevenue)}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-center"><span className="spinner dark" /><span>Loading orders…</span></div>
        ) : orders.length === 0 ? (
          <div className="loading-center" style={{ minHeight: 320 }}>
            <span style={{ fontSize: '3rem', opacity: .3 }}>🎉</span>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No active orders right now</span>
            <span style={{ fontSize: '.8rem', color: 'var(--text-dim)' }}>Refreshes every 15 seconds</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
            {orders.map((o) => {
              const tableLabel = o.tableId?.name || `Table ${o.tableId?.tableNumber ?? '?'}`;
              const subtotal = (o.items ?? []).reduce(
                (s, it) => s + it.priceAtTimeOfOrder * it.quantity, 0
              );
              return (
                <div key={o._id} className="panel" style={{ overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--r-lg)',
                        background: 'var(--accent-dim)', border: '1.5px solid var(--accent-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, color: 'var(--accent)', fontSize: '.8rem',
                      }}>
                        {o.tableId?.tableNumber ?? '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '.9rem' }}>{tableLabel}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-dim)' }}>
                          👤 {o.customerName} · 🕐 {timeAgo(o.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1rem', textAlign: 'right' }}>{fmt(subtotal)}</div>
                      {o.tableId?.zone && (
                        <span className={`zone-pill ${o.tableId.zone === 'AC' ? 'ac' : 'non-ac'}`}>
                          {o.tableId.zone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '1rem 1.25rem' }}>
                    {(o.items ?? []).map((it, idx) => (
                      <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '.35rem 0', borderBottom: idx < o.items.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <span style={{ fontSize: '.85rem', color: 'var(--text)' }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: '.5rem' }}>×{it.quantity}</span>
                          {it.menuItemId?.name ?? 'Item'}
                        </span>
                        <span style={{ fontSize: '.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {fmt(it.priceAtTimeOfOrder * it.quantity)}
                        </span>
                      </div>
                    ))}
                    {o.waiterId?.username && (
                      <div style={{ marginTop: '.75rem', fontSize: '.72rem', color: 'var(--text-dim)' }}>
                        Waiter: @{o.waiterId.username}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{
        padding: '.5rem 1.5rem', borderTop: '1px solid var(--border)',
        fontSize: '.7rem', color: 'var(--text-dim)', background: 'var(--surface)',
      }}>
        Auto-refreshes every 15 seconds
      </div>
    </div>
  );
}
