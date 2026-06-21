// admin/src/components/BillsTable.jsx
// ─────────────────────────────────────────────────────────────
// Renders the billing history records in a responsive table.
// Props:
//   bills   — Bill[]
//   loading — boolean
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { createPortal } from 'react-dom';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0);

const fmtDate = (str) => {
  const d = new Date(str);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function BillsTable({ bills = [], loading, showDetailedItems = false, onDeleteBill }) {
  const [billToDelete, setBillToDelete] = useState(null);

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Phone</th>
            <th>Table</th>
            <th>Items</th>
            <th>GST</th>
            <th>Total</th>
            {onDeleteBill && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={onDeleteBill ? 9 : 8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              <span className="spinner dark" style={{ margin: '0 auto' }} />
            </td></tr>
          ) : bills.length === 0 ? (
            <tr className="empty-row">
              <td colSpan={onDeleteBill ? 9 : 8}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontSize: '2.5rem', opacity: .3 }}>🧾</span>
                  <span>No bills found</span>
                </div>
              </td>
            </tr>
          ) : (
            bills.map((bill) => {
              const tableLabel = bill.tableId
                ? (bill.tableId.name || `Table ${bill.tableId.tableNumber}`)
                : '—';
              const itemCount  = (bill.items ?? []).length;

              return (
                <tr key={bill._id}>
                  <td className="td-muted">{fmtDate(bill.createdAt)}</td>
                  <td style={{ fontWeight: 600 }}>{bill.customerName}</td>
                  <td>
                    {bill.orderType === 'Takeaway' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '99px', fontSize: '0.72rem',
                        fontWeight: 700, background: 'rgba(251,146,60,.15)',
                        border: '1px solid rgba(251,146,60,.4)', color: '#fb923c',
                      }}>🛵 Takeaway</span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 8px', borderRadius: '99px', fontSize: '0.72rem',
                        fontWeight: 700, background: 'rgba(34,197,94,.12)',
                        border: '1px solid rgba(34,197,94,.3)', color: '#4ade80',
                      }}>🪑 Dine-in</span>
                    )}
                  </td>
                  <td className="td-muted">{bill.customerPhone || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      {tableLabel}
                      {bill.tableId?.zone && (
                        <span className={`zone-pill ${bill.tableId.zone === 'AC' ? 'ac' : 'non-ac'}`}>
                          {bill.tableId.zone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="td-muted">
                    {showDetailedItems ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.15rem', fontSize: '.8rem' }}>
                        {(bill.items ?? []).map((item, idx) => {
                          const name = item.menuItem?.name ?? 'Unknown item';
                          return (
                            <div key={idx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{item.quantity}x</span> {name}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      `${itemCount} item${itemCount !== 1 ? 's' : ''}`
                    )}
                  </td>
                  <td className="td-muted">
                    {bill.gstApplied ? fmt(bill.gstApplied) : '—'}
                    {bill.gstPercentage ? ` (${bill.gstPercentage}%)` : ''}
                  </td>
                  <td className="td-amount">{fmt(bill.totalAmount)}</td>
                  {onDeleteBill && (
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setBillToDelete(bill)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* ── Cancel/Delete Bill Confirmation Modal ── */}
      {billToDelete && createPortal(
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="bill-delete-confirm-title">
          <div className="confirm-modal-card">
            <div className="confirm-modal-card__icon" style={{ color: 'var(--danger)' }}>🗑️</div>
            <h3 id="bill-delete-confirm-title" className="confirm-modal-card__title">Delete Bill</h3>
            <p className="confirm-modal-card__text">
              Are you sure you want to permanently delete this bill from the archive? This action cannot be undone.
            </p>
            <div className="confirm-modal-card__actions">
              <button
                type="button"
                className="confirm-modal-card__btn-no"
                onClick={() => setBillToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-modal-card__btn-yes is-danger"
                onClick={() => {
                  const id = billToDelete._id;
                  setBillToDelete(null);
                  onDeleteBill(id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
