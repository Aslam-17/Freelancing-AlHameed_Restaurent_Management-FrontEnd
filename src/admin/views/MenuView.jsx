// frontend/src/admin/views/MenuView.jsx
// ─────────────────────────────────────────────────────────────
// Full CRUD for menu items.
// Categories: Starters, Main Course, Biryani, Breads, Desserts,
//             Drinks, Extras (free-type also allowed).
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { menuApi } from '../api/index.js';

const CATEGORIES = ['Starters', 'Main Course', 'Biryani', 'Breads', 'Desserts', 'Drinks', 'Extras'];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0);

const emptyForm = () => ({ name: '', price: '', category: 'Main Course', isAvailable: true });

// ── Row in the table ──────────────────────────────────────────
function MenuRow({ item, onEdit, onDelete, deleting }) {
  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{item.name}</td>
      <td>
        <span style={{
          padding: '2px .5rem', borderRadius: 'var(--r-full)', fontSize: '.72rem',
          fontWeight: 600, background: 'var(--surface-3)', color: 'var(--text-muted)',
        }}>{item.category}</span>
      </td>
      <td className="td-amount">{fmt(item.price)}</td>
      <td>
        <span style={{
          padding: '2px .6rem', borderRadius: 'var(--r-full)', fontSize: '.72rem', fontWeight: 700,
          background: item.isAvailable ? 'var(--success-dim)' : 'var(--danger-dim)',
          color: item.isAvailable ? 'var(--success)' : 'var(--danger)',
        }}>
          {item.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(item)}>✏️ Edit</button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(item._id)}
            disabled={deleting === item._id}
          >
            {deleting === item._id ? '…' : '🗑'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Add/Edit form panel ───────────────────────────────────────
function MenuForm({ initial, onSaved, onCancel }) {
  const isEdit = Boolean(initial);
  const [form,   setForm]   = useState(initial ? {
    name:        initial.name,
    price:       String(initial.price),
    category:    initial.category,
    isAvailable: initial.isAvailable,
  } : emptyForm());
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError('Enter a valid price.'); return; }
    setError(''); setSaving(true);
    try {
      const payload = { name: form.name.trim(), price, category: form.category, isAvailable: form.isAvailable };
      if (isEdit) {
        await menuApi.update(initial._id, payload);
      } else {
        await menuApi.create(payload);
      }
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="panel" style={{ marginBottom: '1.5rem' }}>
      <div className="panel__header">
        <span className="panel__title">{isEdit ? '✏️ Edit Item' : '➕ New Menu Item'}</span>
        <button className="btn-icon" onClick={onCancel}>✕</button>
      </div>
      <div className="panel__body">
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span className="alert-icon">⚠️</span>{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row" style={{ marginBottom: '.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="mi-name">Name <span>*</span></label>
              <input id="mi-name" className="form-input" type="text" placeholder="e.g. Chicken Biryani"
                value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={80} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="mi-price">Price (₹) <span>*</span></label>
              <input id="mi-price" className="form-input" type="number" min={0} step={0.5} placeholder="0"
                value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="mi-cat">Category <span>*</span></label>
              <select id="mi-cat" className="form-select" value={form.category}
                onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Availability</label>
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.25rem' }}>
                {[true, false].map((v) => (
                  <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.875rem', color: 'var(--text-muted)' }}>
                    <input type="radio" name="mi-avail" checked={form.isAvailable === v}
                      onChange={() => set('isAvailable', v)} />
                    {v ? '✅ Available' : '❌ Unavailable'}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : isEdit ? '💾 Save Changes' : '➕ Add Item'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────
export default function MenuView() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [editing,  setEditing]  = useState(null); // null | 'new' | item object
  const [deleting, setDeleting] = useState(null);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('All');

  const fetchItems = useCallback(async () => {
    setError('');
    try {
      const res = await menuApi.getAll();
      setItems(res.data ?? []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    setDeleting(id);
    try { await menuApi.delete(id); setItems((p) => p.filter((i) => i._id !== id)); }
    catch (e) { setError(e.message); }
    finally { setDeleting(null); }
  };

  const handleSaved = () => { setEditing(null); fetchItems(); };

  const categories = ['All', ...new Set(items.map((i) => i.category))];
  const filtered = items.filter((i) => {
    const matchCat    = catFilter === 'All' || i.category === catFilter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <div className="page-header__breadcrumb">Admin › Menu Items</div>
          <div className="page-header__title">🍽️ Menu Management</div>
        </div>
        <div className="page-header__actions">
          <span className="badge badge-muted">{items.length} items</span>
          <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>➕ Add Item</button>
        </div>
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span className="alert-icon">⚠️</span>{error}</div>}

        {/* Add / Edit form */}
        {editing && (
          <MenuForm
            initial={editing === 'new' ? null : editing}
            onSaved={handleSaved}
            onCancel={() => setEditing(null)}
          />
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar-admin" style={{ flex: 1, maxWidth: 320 }}>
            <span className="search-bar-admin__icon">🔍</span>
            <input className="search-input-admin" type="search" placeholder="Search items…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button key={c}
                style={{
                  height: 34, padding: '0 .875rem', borderRadius: 'var(--r-full)',
                  fontSize: '.8rem', fontWeight: 600, border: '1.5px solid',
                  borderColor: catFilter === c ? 'var(--accent)' : 'var(--border)',
                  background: catFilter === c ? 'var(--accent)' : 'var(--surface-2)',
                  color: catFilter === c ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all .2s',
                }}
                onClick={() => setCatFilter(c)}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>
                  <span className="spinner dark" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr className="empty-row"><td colSpan={5}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
                    <span style={{ fontSize: '2rem', opacity: .3 }}>🍽️</span>
                    <span>{search || catFilter !== 'All' ? 'No items match your filter' : 'No menu items yet — add one above!'}</span>
                  </div>
                </td></tr>
              ) : (
                filtered.map((item) => (
                  <MenuRow key={item._id} item={item} onEdit={setEditing} onDelete={handleDelete} deleting={deleting} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
