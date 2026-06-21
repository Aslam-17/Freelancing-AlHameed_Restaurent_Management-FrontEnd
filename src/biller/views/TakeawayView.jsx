// src/biller/views/TakeawayView.jsx
// ─────────────────────────────────────────────────────────────
// Takeaway order flow — bypasses the table floor plan.
//
// Step 0: Customer details form (Name required, Phone optional)
// Step 1: MenuCart with orderType='Takeaway' (no table needed)
//
// On order success → brief success overlay → reset to step 0
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import MenuCart from '../../waiter/components/MenuCart.jsx';

// ── Simple customer details form for Takeaway ─────────────────
function TakeawayCustomerForm({ onSubmit }) {
  const [name,   setName]   = useState('');
  const [phone,  setPhone]  = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim())             e.name  = 'Customer name is required.';
    if (name.trim().length > 60)  e.name  = 'Name is too long.';
    if (phone && !/^[0-9+\-\s()]{7,15}$/.test(phone.trim())) {
      e.phone = 'Enter a valid phone number (7–15 digits).';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name:           name.trim(),
        phone:          phone.trim(),
        numberOfPeople: 1, // Takeaway defaults to 1
      });
    }
  };

  return (
    <div className="view" style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 'var(--s-4)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--s-2)' }}>🛵</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          New Takeaway Order
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 'var(--s-1) 0 0' }}>
          Enter customer details to continue
        </p>
      </div>

      <form
        className="form-card"
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}
      >
        {/* Order type indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s-2)',
            padding: 'var(--s-2) var(--s-3)',
            borderRadius: 'var(--r-lg)',
            background: 'rgba(251,146,60,.12)',
            border: '1px solid rgba(251,146,60,.3)',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#fb923c',
          }}
        >
          <span>🛵</span>
          <span>Takeaway Order — No table assignment</span>
        </div>

        {/* Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="tkwy-name">
            Customer Name <span>*</span>
          </label>
          <input
            id="tkwy-name"
            className={`form-input ${errors.name ? 'has-error' : ''}`}
            type="text"
            placeholder="e.g. Ahmed Ali"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
            autoComplete="off"
            autoFocus
            maxLength={60}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label className="form-label" htmlFor="tkwy-phone">
            Phone{' '}
            <span style={{ color: 'var(--text-dim)', fontWeight: 400, textTransform: 'none', fontSize: '0.72rem' }}>
              (optional)
            </span>
          </label>
          <input
            id="tkwy-phone"
            className={`form-input ${errors.phone ? 'has-error' : ''}`}
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })); }}
            autoComplete="tel"
            maxLength={15}
            inputMode="tel"
          />
          {errors.phone && <span className="form-error">{errors.phone}</span>}
          {!errors.phone && (
            <span className="form-hint">Useful for delivery or receipt notifications.</span>
          )}
        </div>

        <button className="btn btn-primary" type="submit" style={{ marginTop: 'var(--s-2)' }}>
          Continue to Menu →
        </button>
      </form>
    </div>
  );
}

// ── Main TakeawayView ─────────────────────────────────────────
export default function TakeawayView({ onRefreshOrders }) {
  const [step,        setStep]        = useState(0); // 0 = form, 1 = menu
  const [customer,    setCustomer]    = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  // Key to force remount after success (resets cart)
  const [sessionKey,  setSessionKey]  = useState(0);

  const handleCustomerSubmit = (details) => {
    setCustomer(details);
    setStep(1);
  };

  const handleOrderDone = () => {
    onRefreshOrders?.();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCustomer(null);
      setStep(0);
      setSessionKey((k) => k + 1);
    }, 2200);
  };

  const handleBack = () => {
    setCustomer(null);
    setStep(0);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {step === 0 && (
        <TakeawayCustomerForm key={sessionKey} onSubmit={handleCustomerSubmit} />
      )}

      {step === 1 && customer && (
        <MenuCart
          key={`takeaway-cart-${sessionKey}`}
          table={null}
          customer={customer}
          orderType="Takeaway"
          onDone={handleOrderDone}
          onBack={handleBack}
          isExistingOrder={false}
        />
      )}

      {/* ── Success overlay ── */}
      {showSuccess && (
        <div className="success-overlay" role="alert" aria-live="assertive">
          <div className="success-card">
            <div className="success-card__icon">🛵</div>
            <div className="success-card__title">Takeaway Order Placed!</div>
            <div className="success-card__sub">
              Order for <strong>{customer?.name}</strong> is now active.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
