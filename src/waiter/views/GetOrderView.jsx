// src/views/GetOrderView.jsx
// ─────────────────────────────────────────────────────────────
// Orchestrates the 3-step "Get Order" workflow:
//   Step 0 → Table Blueprint  (select a table)
//   Step 1 → Customer Form    (name / phone)
//   Step 2 → Menu Cart        (build & submit order)
//
// After successful order submission a success overlay shows
// briefly, then the flow resets to step 0.
//
// Props:
//   occupiedTableIds — Set<string> (passed from App, stays in sync)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import TableBlueprint from '../components/TableBlueprint.jsx';
import CustomerForm   from '../components/CustomerForm.jsx';
import MenuCart       from '../components/MenuCart.jsx';

const STEPS = ['Floor Plan', 'Customer', 'Menu'];

export default function GetOrderView({ occupiedTableIds, activeOrders = [], onRefreshOrders, initialParams, onResetParams, orderType = 'Dine-in' }) {
  const [selectedTable,   setSelectedTable]   = useState(initialParams?.table ?? null);
  const [customerDetails, setCustomerDetails] = useState(initialParams?.customer ?? null);
  const [step,            setStep]            = useState(initialParams?.step ?? 0);
  const [showSuccess,     setShowSuccess]     = useState(false);

  // Animate step changes
  const [stepKey, setStepKey] = useState(0);

  const goToStep = (n) => {
    setStep(n);
    setStepKey((k) => k + 1);
  };

  // ── Table selected → go to customer form ──────────────────
  const handleTableSelect = (table) => {
    setSelectedTable(table);
    goToStep(1);
  };

  // ── Customer submitted → go to menu ──────────────────────
  const handleCustomerSubmit = (details) => {
    setCustomerDetails(details);
    goToStep(2);
  };

  // ── Order placed → show success then reset ─────────────
  const handleOrderDone = () => {
    onResetParams?.();   // clear edit parameters
    onRefreshOrders?.(); // refresh occupied status immediately
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedTable(null);
      setCustomerDetails(null);
      goToStep(0);
    }, 2200);
  };

  // ── Back handlers ─────────────────────────────────────────
  const handleBackFromCustomer = () => { setSelectedTable(null); goToStep(0); };
  const handleBackFromMenu     = () => {
    if (initialParams) {
      // If we came from the edit order button directly, going back returns to Floor Plan and clears params
      onResetParams?.();
      setSelectedTable(null);
      setCustomerDetails(null);
      goToStep(0);
    } else {
      // Normal flow: go back to customer details
      setCustomerDetails(null);
      goToStep(1);
    }
  };

  // ── Step dot widths ───────────────────────────────────────
  const dotWidths = STEPS.map((_, i) => {
    if (i < step)  return '24px';  // done
    if (i === step) return '32px'; // active
    return '8px';                  // future
  });

  const isExistingOrder = !!initialParams;

  return (
    <div className="view" style={{ position: 'relative' }}>
      {/* ── Step progress dots ── */}
      <div className="step-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Breadcrumb */}
          <div className="step-breadcrumb">
            {STEPS.map((label, i) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className={`step-breadcrumb__item ${i === step ? 'is-active' : ''}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <span className="step-breadcrumb__sep">›</span>}
              </span>
            ))}
          </div>

          {/* Step dots */}
          <div className="step-dots">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`step-dot ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}
                style={{ width: dotWidths[i] }}
              />
            ))}
          </div>
        </div>

        {/* Dynamic header line */}
        {step === 0 && (
          <div>
            <div className="section-title" style={{ padding: 0 }}>Select a Table</div>
            <div className="section-subtitle" style={{ padding: 0 }}>
              Tap a table to start taking an order.
            </div>
          </div>
        )}
      </div>

      {/* ── Step content ── */}
      <div key={stepKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideInUp 250ms cubic-bezier(0.16,1,0.3,1) both' }}>
        {step === 0 && (
          <TableBlueprint
            selectedTable={selectedTable}
            occupiedTableIds={occupiedTableIds}
            onSelect={handleTableSelect}
          />
        )}

        {step === 1 && selectedTable && (
          <CustomerForm
            table={selectedTable}
            onSubmit={handleCustomerSubmit}
            onBack={handleBackFromCustomer}
          />
        )}

        {step === 2 && selectedTable && customerDetails && (
          <MenuCart
            table={selectedTable}
            customer={customerDetails}
            onDone={handleOrderDone}
            onBack={handleBackFromMenu}
            isExistingOrder={isExistingOrder}
            initialItems={initialParams?.existingItems}
            orderId={initialParams?.orderId}
            orderType={orderType}
          />
        )}
      </div>

      {/* ── Success overlay ── */}
      {showSuccess && (
        <div className="success-overlay" role="alert" aria-live="assertive">
          <div className="success-card">
            <div className="success-card__icon">✅</div>
            <div className="success-card__title">Order Placed!</div>
            <div className="success-card__text">
              Order for <strong>{customerDetails?.name}</strong> at{' '}
              <strong>{selectedTable?.name || `Table ${selectedTable?.tableNumber}`}</strong>{' '}
              has been sent to the kitchen queue.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
