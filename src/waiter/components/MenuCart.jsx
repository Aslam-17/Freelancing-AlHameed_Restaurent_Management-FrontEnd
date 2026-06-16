// src/components/MenuCart.jsx
// ─────────────────────────────────────────────────────────────
// Step 2: Searchable / filterable menu with a running cart.
//
// Props:
//   table      — Table object
//   customer   — { name, phone }
//   onDone     — (items) => void   called with backend-format items
//   onBack     — () => void
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
import { menuApi, ordersApi } from '../api/index.js';

// ── Currency formatter ─────────────────────────────────────
const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

export default function MenuCart({ table, customer, onDone, onBack, isExistingOrder, initialItems = [], orderId }) {
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [activecat, setActiveCat] = useState('All');
  const [cart,      setCart]      = useState(() => {
    if (!initialItems || initialItems.length === 0) return {};
    const initialCart = {};
    initialItems.forEach((line) => {
      const menuItem = line.menuItem;
      if (menuItem) {
        const id = menuItem._id || menuItem;
        initialCart[id] = {
          item: {
            _id:      id,
            name:     menuItem.name || 'Unknown Item',
            price:    line.priceAtTimeOfOrder ?? menuItem.price ?? 0,
            category: menuItem.category || ''
          },
          qty: line.quantity
        };
      }
    });
    return initialCart;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');

  // ── Fetch menu on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await menuApi.getAll();
        if (!cancelled) setItems(res.data ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Unique categories ────────────────────────────────────
  const categories = useMemo(() => {
    const cats = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
    return ['All', ...cats];
  }, [items]);

  // ── Filtered items ───────────────────────────────────────
  const filtered = useMemo(() => {
    let list = items;
    if (activecat !== 'All') list = list.filter((i) => i.category === activecat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q));
    }
    return list;
  }, [items, activecat, search]);

  // ── Cart helpers ─────────────────────────────────────────
  const getQty   = (id)  => cart[id]?.qty ?? 0;

  const setQty   = (item, delta) => {
    setCart((prev) => {
      const cur = prev[item._id]?.qty ?? 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const { [item._id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item._id]: { item, qty: next } };
    });
  };

  // ── Cart summary ─────────────────────────────────────────
  const cartEntries  = Object.values(cart);
  const cartTotal    = cartEntries.reduce((s, { item, qty }) => s + item.price * qty, 0);
  const cartItemsCnt = cartEntries.reduce((s, { qty }) => s + qty, 0);
  const hasItems     = cartEntries.length > 0;

  // ── Submit order ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!hasItems) return;
    setSubmitErr('');
    setSubmitting(true);

    const orderItems = cartEntries.map(({ item, qty }) => ({
      menuItemId: item._id,
      quantity:   qty,
    }));

    try {
      await ordersApi.create({
        tableId:       table._id,
        customerName:  customer.name,
        customerPhone: customer.phone || undefined,
        items:         orderItems,
        orderId:       orderId,
      });
      onDone(); // signal success to parent
    } catch (err) {
      setSubmitErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error ──────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner dark" />
        <span>Loading menu…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <span style={{ color: 'var(--danger)' }}>{error}</span>
      </div>
    );
  }

  return (
    <div className="menu-view">
      {/* ── Sticky top: search + categories ── */}
      <div className="menu-sticky-top">
        {/* Back + context */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" className="btn-back" onClick={onBack}>
            ← {isExistingOrder ? 'Floor Plan' : 'Customer'}
          </button>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'right' }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{customer.name}</span>
            {isExistingOrder && (
              <span style={{
                display: 'inline-block',
                marginLeft: '0.4rem',
                padding: '2px 6px',
                fontSize: '0.62rem',
                fontWeight: 700,
                borderRadius: '4px',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-glow)',
                verticalAlign: 'middle',
                textTransform: 'uppercase'
              }}>
                Active
              </span>
            )}
            <br />
            {table?.name || `Table ${table?.tableNumber}`}
          </div>
        </div>

        {/* Search */}
        <div className="search-bar">
          <span className="search-bar__icon">🔍</span>
          <input
            className="search-input"
            type="search"
            placeholder="Search menu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search menu items"
          />
        </div>

        {/* Category tabs */}
        <div className="category-tabs" role="tablist" aria-label="Menu categories">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activecat === cat}
              className={`cat-tab ${activecat === cat ? 'is-active' : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu list ── */}
      {submitErr && (
        <div className="alert alert-error" style={{ margin: 'var(--s-3) var(--s-4) 0' }}>
          <span className="alert-icon">⚠️</span>
          {submitErr}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🍽️</div>
          <div className="empty-state__title">No items found</div>
          <div className="empty-state__text">Try a different search or category.</div>
        </div>
      ) : (
        <div className="menu-list">
          {filtered.map((item) => {
            const qty     = getQty(item._id);
            const inCart  = qty > 0;
            return (
              <div
                key={item._id}
                className={`menu-item ${inCart ? 'in-cart' : ''}`}
              >
                {/* Info */}
                <div className="menu-item__info">
                  <div className="menu-item__name">{item.name}</div>
                  <div className="menu-item__cat">{item.category}</div>
                  <div className="menu-item__price">{formatCurrency(item.price)}</div>
                </div>

                {/* Stepper */}
                <div className="qty-stepper">
                  {inCart && (
                    <>
                      <button
                        type="button"
                        className="qty-btn minus"
                        onClick={() => setQty(item, -1)}
                        aria-label={`Remove one ${item.name}`}
                      >
                        −
                      </button>
                      <span className="qty-value">{qty}</span>
                    </>
                  )}
                  <button
                    type="button"
                    className="qty-btn plus"
                    onClick={() => setQty(item, +1)}
                    aria-label={`Add ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cart summary bar (fixed bottom) ── */}
      {hasItems && (
        <div className="cart-bar">
          <div className="cart-bar__summary">
            <div className="cart-bar__items">
              🛒 {cartItemsCnt} item{cartItemsCnt > 1 ? 's' : ''} selected
            </div>
            <div className="cart-bar__total">{formatCurrency(cartTotal)}</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <><span className="spinner" /> {isExistingOrder ? 'Updating Order…' : 'Placing Order…'}</>
            ) : (
              isExistingOrder ? '✅ Add to Order' : '✅ Place Order'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
