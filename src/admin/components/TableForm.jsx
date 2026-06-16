// admin/src/components/TableForm.jsx
// ─────────────────────────────────────────────────────────────
// Create or Edit a table.
// Props:
//   table      — Table | null (null = create mode)
//   onSaved    — () => void (triggers parent refetch)
//   onDelete   — (id) => void
//   onCancel   — () => void
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { tablesApi } from '../api/index.js';

const CAPS = [3, 4, 5, 6, 8];
const ZONES = ['AC', 'Non-AC'];

const empty = () => ({
  tableNumber: '',
  name:        '',
  capacity:    '4',
  zone:        'AC',
  x:           '60',
  y:           '60',
});

export default function TableForm({ table, onSaved, onDelete, onCancel }) {
  const isEdit = Boolean(table);
  const [form,    setForm]    = useState(empty);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(false);
  const [error,   setError]   = useState('');

  // Populate form when editing
  useEffect(() => {
    if (table) {
      setForm({
        tableNumber: String(table.tableNumber ?? ''),
        name:        table.name ?? '',
        capacity:    String(table.capacity ?? 4),
        zone:        table.zone ?? 'AC',
        x:           String(table.blueprintData?.x ?? 60),
        y:           String(table.blueprintData?.y ?? 60),
      });
    } else {
      setForm(empty());
    }
    setError('');
  }, [table]);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    if (!form.tableNumber || isNaN(Number(form.tableNumber))) return 'Table number is required.';
    if (!CAPS.includes(Number(form.capacity))) return 'Select a valid capacity.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    const payload = {
      tableNumber:   Number(form.tableNumber),
      name:          form.name.trim() || undefined,
      capacity:      Number(form.capacity),
      zone:          form.zone,
      blueprintData: {
        x: Number(form.x) || 60,
        y: Number(form.y) || 60,
        svgType: 'rect',
      },
    };
    try {
      if (isEdit) {
        await tablesApi.update(table._id, payload);
      } else {
        await tablesApi.create(payload);
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete table "${table.name || `T${table.tableNumber}`}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await tablesApi.delete(table._id);
      onDelete(table._id);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="table-form-panel">
      <div className="table-form-panel__header">
        <span>{isEdit ? `✏️ Edit Table` : '➕ Add Table'}</span>
        {onCancel && (
          <button className="btn-icon" onClick={onCancel} title="Cancel">✕</button>
        )}
      </div>

      <form className="table-form-panel__body" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>{error}
          </div>
        )}

        {/* Number + Name */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="tf-num">Number <span>*</span></label>
            <input
              id="tf-num"
              className="form-input"
              type="number" min={1}
              placeholder="e.g. 1"
              value={form.tableNumber}
              onChange={(e) => set('tableNumber', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tf-name">Name (optional)</label>
            <input
              id="tf-name"
              className="form-input"
              type="text"
              placeholder="e.g. Window Seat"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              maxLength={40}
            />
          </div>
        </div>

        {/* Capacity + Zone */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="tf-cap">Capacity <span>*</span></label>
            <select
              id="tf-cap"
              className="form-select"
              value={form.capacity}
              onChange={(e) => set('capacity', e.target.value)}
            >
              {CAPS.map((c) => (
                <option key={c} value={c}>{c} seats</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tf-zone">Zone <span>*</span></label>
            <select
              id="tf-zone"
              className="form-select"
              value={form.zone}
              onChange={(e) => set('zone', e.target.value)}
            >
              {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        {/* Blueprint coordinates */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="tf-x">X Position</label>
            <input
              id="tf-x"
              className="form-input"
              type="number" min={0} max={1190}
              value={form.x}
              onChange={(e) => set('x', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tf-y">Y Position</label>
            <input
              id="tf-y"
              className="form-input"
              type="number" min={0} max={570}
              value={form.y}
              onChange={(e) => set('y', e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <button className="btn btn-primary btn-full" type="submit" disabled={saving}>
          {saving
            ? <><span className="spinner" /> Saving…</>
            : isEdit ? '💾 Save Changes' : '➕ Add Table'}
        </button>

        {isEdit && (
          <button
            type="button"
            className="btn btn-danger btn-full"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <><span className="spinner" /> Deleting…</> : '🗑 Delete Table'}
          </button>
        )}
      </form>
    </div>
  );
}
