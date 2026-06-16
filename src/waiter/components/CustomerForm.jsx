// src/components/CustomerForm.jsx
// ─────────────────────────────────────────────────────────────
// Step 1: Collect customer details before opening the menu.
//
// Props:
//   table     — the selected Table object
//   onSubmit  — ({ name, phone }) => void
//   onBack    — () => void
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';

export default function CustomerForm({ table, onSubmit, onBack }) {
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim())           e.name = 'Customer name is required.';
    if (name.trim().length > 60) e.name = 'Name is too long.';
    if (phone && !/^[0-9+\-\s()]{7,15}$/.test(phone.trim())) {
      e.phone = 'Enter a valid phone number (7–15 digits).';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name: name.trim(), phone: phone.trim() });
    }
  };

  const tableLabel = table?.name || `Table ${table?.tableNumber}`;

  return (
    <form className="form-page" onSubmit={handleSubmit} noValidate>
      {/* Back */}
      <button type="button" className="btn-back" onClick={onBack}>
        ← Back to floor plan
      </button>

      {/* Table info strip */}
      <div className="form-card">
        <div className="form-card__table-info">
          <div className="form-card__table-icon">🪑</div>
          <div className="form-card__table-details">
            <div className="form-card__table-name">{tableLabel}</div>
            <div className="form-card__table-meta">
              {table?.capacity} seats · {table?.zone} zone
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 'var(--s-1)' }}>
          Customer Details
        </h2>

        {/* Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="cust-name">
            Name <span>*</span>
          </label>
          <input
            id="cust-name"
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
          <label className="form-label" htmlFor="cust-phone">
            Phone <span style={{ color: 'var(--text-dim)', fontWeight: 400, textTransform: 'none', fontSize: '0.72rem' }}>(optional)</span>
          </label>
          <input
            id="cust-phone"
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
          {!errors.phone && <span className="form-hint">Optional — for receipts or delivery.</span>}
        </div>
      </div>

      <button className="btn btn-primary" type="submit">
        Continue to Menu →
      </button>
    </form>
  );
}
