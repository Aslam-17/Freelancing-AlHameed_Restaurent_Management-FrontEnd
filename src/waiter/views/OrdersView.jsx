// src/views/OrdersView.jsx
// ─────────────────────────────────────────────────────────────
// Active orders queue — fetches from the backend and auto-refreshes
// every 30 seconds. Waiters can "Complete" an order here.
//
// Props:
//   onOrdersChange — (orders) => void  (notifies App for the badge count)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ordersApi } from '../api/index.js';
import OrderCard from '../components/OrderCard.jsx';
import ReceiptTemplate from '../../biller/components/ReceiptTemplate.jsx';

const POLL_INTERVAL = 30_000; // 30 seconds

export default function OrdersView({ onOrdersChange, onAddItems, user }) {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(new Set()); // IDs being completed
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [orderToDelete,   setOrderToDelete]   = useState(null);
  const [printingOrder,   setPrintingOrder]   = useState(null);
  const [warningOrder,    setWarningOrder]    = useState(null);
  const [printedOrders,   setPrintedOrders]   = useState(new Set());

  const pollTimer = useRef(null);
  const printRef  = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      if (printingOrder) {
        setPrintedOrders((prev) => new Set(prev).add(printingOrder._id));
      }
    }
  });

  // ── Fetch active orders ───────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError('');
    try {
      const res = await ordersApi.getActive();
      const data = res.data ?? [];
      setOrders(data);
      onOrdersChange?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onOrdersChange]);

  // ── Mount: fetch + start polling ─────────────────────────
  useEffect(() => {
    fetchOrders();

    pollTimer.current = setInterval(() => fetchOrders(true), POLL_INTERVAL);

    return () => clearInterval(pollTimer.current);
  }, [fetchOrders]);

  // ── Complete an order ────────────────────────────────────
  const handleComplete = async (order) => {
    const id = order._id;
    setCompleting((prev) => new Set(prev).add(id));
    try {
      await ordersApi.complete(id);

      // Optimistically remove from UI
      setOrders((prev) => {
        const updated = prev.filter((o) => o._id !== id);
        onOrdersChange?.(updated);
        return updated;
      });
      // Clear printed state
      setPrintedOrders((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setError(`Failed to complete order: ${err.message}`);
    } finally {
      setCompleting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handlePrintClick = (order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  // ── Delete/Cancel an order ──────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await ordersApi.delete(id);
      // Optimistically remove from UI
      setOrders((prev) => {
        const updated = prev.filter((o) => o._id !== id);
        onOrdersChange?.(updated);
        return updated;
      });
    } catch (err) {
      setError(`Failed to cancel order: ${err.message}`);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner dark" />
        <span>Loading active orders…</span>
      </div>
    );
  }

  return (
    <>
      <div className="orders-view">
        {/* ── Header ── */}
        <div className="orders-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
            <span className="orders-header__title">Active Orders</span>
            {orders.length > 0 && (
              <span className="orders-header__count">{orders.length}</span>
            )}
          </div>

          <button
            className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchOrders()}
            aria-label="Refresh orders"
            disabled={refreshing}
          >
            ↺
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* ── Orders list / empty state ── */}
        {orders.length === 0 && !error ? (
          <div className="empty-state" style={{ flex: 1 }}>
            <div className="empty-state__icon">🎉</div>
            <div className="empty-state__title">No active orders</div>
            <div className="empty-state__text">
              All orders are completed. The floor is clear!
            </div>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onComplete={() => {
                  if (!printedOrders.has(order._id)) {
                    setWarningOrder(order);
                  } else {
                    setConfirmingOrder(order);
                  }
                }}
                completing={completing.has(order._id)}
                onAddItems={onAddItems}
                onDelete={() => setOrderToDelete(order)}
                onPrint={(!user || user.role === 'Biller' || user.role === 'Admin') ? () => handlePrintClick(order) : undefined}
                canComplete={!user || user.role === 'Biller' || user.role === 'Admin'}
              />
            ))}
          </div>
        )}

        {/* Polling note */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          padding: 'var(--s-3)',
          paddingBottom: 'calc(var(--s-3) + env(safe-area-inset-bottom))',
        }}>
          Auto-refreshes every 30 seconds
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {confirmingOrder && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="confirm-modal-card">
            <div className="confirm-modal-card__icon">❓</div>
            <h3 id="confirm-title" className="confirm-modal-card__title">Complete Order</h3>
            <p className="confirm-modal-card__text">
              Do you want to complete the order for <strong>{confirmingOrder.customerName}</strong> at <strong>{confirmingOrder.tableId?.name || `Table ${confirmingOrder.tableId?.tableNumber}`}</strong>?
            </p>
            <div className="confirm-modal-card__actions">
              <button
                type="button"
                className="confirm-modal-card__btn-no"
                onClick={() => setConfirmingOrder(null)}
              >
                No
              </button>
              <button
                type="button"
                className="confirm-modal-card__btn-yes"
                onClick={() => {
                  const order = confirmingOrder;
                  setConfirmingOrder(null);
                  handleComplete(order);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel/Delete Confirmation Modal ── */}
      {orderToDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
          <div className="confirm-modal-card">
            <div className="confirm-modal-card__icon" style={{ color: 'var(--danger)' }}>🗑️</div>
            <h3 id="delete-confirm-title" className="confirm-modal-card__title">Delete Order</h3>
            <p className="confirm-modal-card__text">
              Are you sure you want to cancel and delete the order for <strong>{orderToDelete.customerName}</strong> at <strong>{orderToDelete.tableId?.name || `Table ${orderToDelete.tableId?.tableNumber}`}</strong>?
            </p>
            <div className="confirm-modal-card__actions">
              <button
                type="button"
                className="confirm-modal-card__btn-no"
                onClick={() => setOrderToDelete(null)}
              >
                No
              </button>
              <button
                type="button"
                className="confirm-modal-card__btn-yes is-danger"
                onClick={() => {
                  const id = orderToDelete._id;
                  setOrderToDelete(null);
                  handleDelete(id);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Warning Confirmation Modal ── */}
      {warningOrder && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="warning-title">
          <div className="confirm-modal-card">
            <div className="confirm-modal-card__icon" style={{ color: '#eab308' }}>⚠️</div>
            <h3 id="warning-title" className="confirm-modal-card__title">Bill Not Printed!</h3>
            <p className="confirm-modal-card__text">
              You are trying to complete the order for <strong>{warningOrder.customerName}</strong> without generating a bill. Do you want to complete it anyway?
            </p>
            <div className="confirm-modal-card__actions">
              <button
                type="button"
                className="confirm-modal-card__btn-no"
                onClick={() => setWarningOrder(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-modal-card__btn-yes"
                style={{ background: '#eab308', color: '#000' }}
                onClick={() => {
                  const order = warningOrder;
                  setWarningOrder(null);
                  handleComplete(order);
                }}
              >
                Complete Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden Print Container ── */}
      <div style={{ display: 'none' }}>
        <ReceiptTemplate ref={printRef} order={printingOrder} />
      </div>
    </>
  );
}
