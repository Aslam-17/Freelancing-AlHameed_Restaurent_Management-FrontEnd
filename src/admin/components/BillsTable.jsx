// admin/src/components/BillsTable.jsx
// ─────────────────────────────────────────────────────────────
// Renders the billing history records in a responsive table.
// Props:
//   bills   — Bill[]
//   loading — boolean
// ─────────────────────────────────────────────────────────────

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
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Customer</th>
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
            <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              <span className="spinner dark" style={{ margin: '0 auto' }} />
            </td></tr>
          ) : bills.length === 0 ? (
            <tr className="empty-row">
              <td colSpan={onDeleteBill ? 8 : 7}>
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
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this bill?')) {
                            onDeleteBill(bill._id);
                          }
                        }}
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
    </div>
  );
}
