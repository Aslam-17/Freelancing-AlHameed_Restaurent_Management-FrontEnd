// src/biller/components/ReceiptTemplate.jsx
// ─────────────────────────────────────────────────────────────
// Receipt formatting for a 58mm (2-inch) thermal printer.
// Max width ~200px.
// ─────────────────────────────────────────────────────────────
import React from 'react';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

const ReceiptCopy = ({ order, copyType }) => {
  if (!order) return null;

  const isTakeaway = order.orderType === 'Takeaway';
  const tableLabel = isTakeaway
    ? 'Takeaway'
    : order.tableId
      ? (order.tableId.name || `Table ${order.tableId.tableNumber}`)
      : 'Unknown Table';

  return (
    <div style={{
      width: '200px',
      margin: '0 auto',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: 'black',
      lineHeight: '1.2',
      padding: '0',
      boxSizing: 'border-box'
    }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
        Al Hameed Restaurant
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '10px' }}>
        --- {copyType} ---
      </div>

      <div style={{ marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '4px' }}>
        <div>Type: {order.orderType || 'Dine-in'}</div>
        <div>Date: {new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        <div>Cust: {order.customerName}</div>
        {!isTakeaway && <div>Table: {tableLabel}</div>}
      </div>

      <div style={{ marginBottom: '8px', borderBottom: '1px dashed black', paddingBottom: '4px' }}>
        {(order.items ?? []).map((item, idx) => {
          const name = item.menuItem?.name || 'Unknown Item';
          const price = item.priceAtTimeOfOrder || 0;
          return (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <div style={{ flex: 1, paddingRight: '4px' }}>{item.quantity}x {name}</div>
              <div>{formatCurrency(price * item.quantity)}</div>
            </div>
          );
        })}
        {order.acCharge > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <div style={{ flex: 1, paddingRight: '4px' }}>AC Charge</div>
            <div>{formatCurrency(order.acCharge)}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
        <div>TOTAL</div>
        <div>{formatCurrency(order.totalAmount)}</div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px' }}>
        Thank You!
      </div>
    </div>
  );
};

const ReceiptTemplate = React.forwardRef(({ order }, ref) => {
  if (!order) return null;

  const isTakeaway = order.orderType === 'Takeaway';

  return (
    <div ref={ref}>
      {isTakeaway ? (
        <>
          <ReceiptCopy order={order} copyType="Customer Copy" />
          <div style={{ pageBreakAfter: 'always' }}></div>
          <ReceiptCopy order={order} copyType="Kitchen Copy" />
        </>
      ) : (
        <ReceiptCopy order={order} copyType="Customer Copy" />
      )}
    </div>
  );
});

export default ReceiptTemplate;
