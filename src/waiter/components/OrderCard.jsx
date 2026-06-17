// src/components/OrderCard.jsx
// ─────────────────────────────────────────────────────────────
// Displays a single active order with all items, running total,
// and a "Complete" button.
//
// Props:
//   order       — Order document (populated from backend)
//   onComplete  — (id) => void
//   completing  — boolean (shows spinner while this card completes)
// ─────────────────────────────────────────────────────────────

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

/** How long ago was this order placed? */
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function OrderCard({ order, onComplete, completing, onAddItems, onDelete }) {
  // ── Derive table label ──────────────────────────────────
  const tableLabel = order.tableId
    ? (order.tableId.name || `Table ${order.tableId.tableNumber}`)
    : 'Unknown Table';

  // ── Calculate subtotal from item snapshots ─────────────
  const subtotal = (order.items ?? []).reduce(
    (acc, item) => acc + item.priceAtTimeOfOrder * item.quantity,
    0
  );

  // Use stored totalAmount if available; otherwise fall back to subtotal
  const total = order.totalAmount || subtotal;

  return (
    <article className="order-card">
      {/* ── Header ── */}
      <div className="order-card__header">
        {/* Table badge */}
        <div className="order-card__table-badge">
          {order.tableId?.tableNumber
             ? <>T<br />{order.tableId.tableNumber}</>
             : '?'}
        </div>

        {/* Customer info + time */}
        <div className="order-card__meta">
          <div className="order-card__customer">{order.customerName}</div>
          {order.customerPhone && (
            <div className="order-card__phone">📞 {order.customerPhone}</div>
          )}
          <div className="order-card__time">
            <span>🕐</span>
            <span>{timeAgo(order.createdAt)}</span>
            <span>·</span>
            <span style={{ color: 'var(--ac-color)' }}>{order.tableId?.zone ?? ''}</span>
          </div>
        </div>

        {/* Waiter name */}
        {order.waiterId?.username && (
          <div className="order-card__waiter">
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>by</span>
            <br />
            <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              @{order.waiterId.username}
            </span>
          </div>
        )}
      </div>

      {/* ── Items list ── */}
      <div className="order-card__items">
        {(order.items ?? []).map((line, i) => {
          const name  = line.menuItem?.name  ?? 'Unknown item';
          const price = line.priceAtTimeOfOrder ?? line.menuItem?.price ?? 0;
          return (
            <div key={i} className="order-card__item">
              <span className="order-card__item-qty">{line.quantity}×</span>
              <span className="order-card__item-name">{name}</span>
              <span className="order-card__item-price">
                {formatCurrency(price * line.quantity)}
              </span>
            </div>
          );
        })}
        {(order.acCharge || 0) > 0 && (
          <div className="order-card__item" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
            <span className="order-card__item-qty" style={{ visibility: 'hidden' }}>1×</span>
            <span className="order-card__item-name" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>AC Seating Charge</span>
            <span className="order-card__item-price">{formatCurrency(order.acCharge)}</span>
          </div>
        )}
      </div>

      <div className="order-card__footer" style={{ gap: 'var(--s-2)' }}>
        <div className="order-card__total">
          <span className="order-card__total-label">Total (excl. GST)</span>
          <span className="order-card__total-amount">{formatCurrency(total)}</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--s-2)', flexShrink: 0 }}>
          <button
            type="button"
            className="btn-delete-order"
            onClick={() => {
              if (window.confirm("Are you sure you want to cancel and delete this order?")) {
                onDelete?.(order._id);
              }
            }}
            disabled={completing}
            aria-label={`Cancel order for ${order.customerName}`}
          >
            🗑 Delete
          </button>

          <button
            type="button"
            className="btn-add-items"
            onClick={() => onAddItems?.(order)}
            disabled={completing}
            aria-label={`Edit items for order of ${order.customerName}`}
          >
            📝 Edit
          </button>

          <button
            className="btn-complete"
            onClick={() => onComplete(order._id)}
            disabled={completing}
            aria-label={`Complete order for ${order.customerName}`}
          >
            {completing
              ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Finalising…</>
              : <>✔ Complete</>}
          </button>
        </div>
      </div>
    </article>
  );
}
