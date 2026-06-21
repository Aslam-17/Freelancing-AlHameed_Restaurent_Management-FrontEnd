// frontend/src/admin/views/WaitersView.jsx
// ─────────────────────────────────────────────────────────────
// Admin — manage Waiter accounts.
// • List all waiters
// • Add a new waiter (username + password)
// • Edit username
// • Reset password
// • Delete waiter
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../api/index.js';

const fmtDate = (str) =>
  str ? new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Add Waiter form ───────────────────────────────────────────
function AddWaiterForm({ onSaved, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Waiter');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('Both fields are required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setSaving(true);
    try {
      await usersApi.create({ username: username.trim().toLowerCase(), password, role });
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="panel" style={{ marginBottom: '1.5rem' }}>
      <div className="panel__header">
        <span className="panel__title">➕ Add Waiter Account</span>
        <button className="btn-icon" onClick={onCancel}>✕</button>
      </div>
      <div className="panel__body">
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span className="alert-icon">⚠️</span>{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="w-uname">Username <span>*</span></label>
              <input id="w-uname" className="form-input" type="text" placeholder="e.g. waiter2"
                value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="w-pass">Password <span>*</span></label>
              <input id="w-pass" className="form-input" type="password" placeholder="Min 6 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="w-role">Role <span>*</span></label>
              <select id="w-role" className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Waiter">Waiter</option>
                <option value="Biller">Biller</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? <><span className="spinner" /> Creating…</> : '➕ Create Account'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit username inline ───────────────────────────────────────
function EditUsernameForm({ waiter, onSaved, onCancel }) {
  const [username, setUsername] = useState(waiter.username);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username is required.'); return; }
    setError(''); setSaving(true);
    try { await usersApi.update(waiter._id, { username: username.trim().toLowerCase() }); onSaved(); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }} noValidate>
      {error && <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>{error}</span>}
      <input className="form-input" style={{ height: 34, fontSize: '.85rem', width: 160 }} type="text"
        value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
      <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? '…' : '✔'}</button>
      <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel}>✕</button>
    </form>
  );
}

// ── Reset password inline ──────────────────────────────────────
function ResetPasswordForm({ waiter, onDone, onCancel }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Min 6 characters.'); return; }
    setError(''); setSaving(true);
    try {
      await usersApi.resetPassword(waiter._id, password);
      setSuccess('Password reset!');
      setTimeout(() => { setSuccess(''); onDone(); }, 1500);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }} noValidate>
      {error && <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>{error}</span>}
      {success && <span style={{ color: 'var(--success)', fontSize: '.75rem' }}>{success}</span>}
      <input className="form-input" style={{ height: 34, fontSize: '.85rem', width: 180 }}
        type="password" placeholder="New password (min 6)" value={password}
        onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="new-password" />
      <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? '…' : '🔑 Set'}</button>
      <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel}>✕</button>
    </form>
  );
}

// ── Waiter row ─────────────────────────────────────────────────
function WaiterRow({ waiter, onDelete, onUpdated, deleting }) {
  const [mode, setMode] = useState('view'); // 'view'|'edit'|'reset'

  return (
    <tr>
      {/* Username */}
      <td>
        {mode === 'edit' ? (
          <EditUsernameForm waiter={waiter} onSaved={() => { setMode('view'); onUpdated(); }} onCancel={() => setMode('view')} />
        ) : (
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>@{waiter.username}</span>
        )}
      </td>
      {/* Role */}
      <td>
        <span className={`badge ${waiter.role === 'Admin' ? 'badge-primary' : 'badge-muted'}`}>
          {waiter.role || 'Waiter'}
        </span>
      </td>
      {/* Created */}
      <td className="td-muted">{fmtDate(waiter.createdAt)}</td>
      {/* Password */}
      <td>
        {mode === 'reset' ? (
          <ResetPasswordForm waiter={waiter} onDone={() => setMode('view')} onCancel={() => setMode('view')} />
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => setMode('reset')}>🔑 Reset</button>
        )}
      </td>
      {/* Actions */}
      <td>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {mode !== 'edit' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}>
              ✏️ Edit
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(waiter)} disabled={deleting}>
            {deleting ? '…' : '🗑 Delete'}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main view ─────────────────────────────────────────────────
export default function WaitersView() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchStaff = useCallback(async () => {
    setError('');
    try { const res = await usersApi.listStaff(); setStaff(res.data ?? []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const executeDelete = async () => {
    if (!staffToDelete) return;
    const id = staffToDelete._id;
    setDeletingId(id);
    setStaffToDelete(null);
    try {
      await usersApi.delete(id);
      setStaff((p) => p.filter((x) => x._id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header">
          <div>
            <div className="page-header__breadcrumb">Admin › Staff Management</div>
            <div className="page-header__title">👤 Staff Management</div>
          </div>
          <div className="page-header__actions">
            <span className="badge badge-muted">{staff.length} member{staff.length !== 1 ? 's' : ''}</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? '✕ Cancel' : '➕ Add Staff'}
            </button>
          </div>
        </div>

        <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span className="alert-icon">⚠️</span>{error}</div>}

          {/* Add form */}
          {showForm && (
            <AddWaiterForm
              onSaved={() => { setShowForm(false); fetchStaff(); }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* Info */}
          <div className="alert" style={{ background: 'var(--info-dim)', border: '1px solid rgba(56,189,248,.2)', color: 'rgba(186,230,253,.8)', marginBottom: '1.25rem' }}>
            <span>ℹ️</span>
            About managing the staff accounts
          </div>

          {/* Table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Password</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>
                    <span className="spinner dark" style={{ margin: '0 auto' }} />
                  </td></tr>
                ) : staff.length === 0 ? (
                  <tr className="empty-row"><td colSpan={5}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>
                      <span style={{ fontSize: '2rem', opacity: .3 }}>👤</span>
                      <span>No staff accounts yet — add one above.</span>
                    </div>
                  </td></tr>
                ) : (
                  staff.map((w) => (
                    <WaiterRow
                      key={w._id}
                      waiter={w}
                      onDelete={setStaffToDelete}
                      onUpdated={fetchStaff}
                      deleting={deletingId === w._id}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {staffToDelete && (
        <div className="modal-overlay" onClick={() => setStaffToDelete(null)}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-card__icon" style={{ color: 'var(--danger)' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="confirm-modal-card__title">Delete Staff Account?</h3>
            <p className="confirm-modal-card__text">
              Are you sure you want to delete <strong>@{staffToDelete.username}</strong>? This cannot be undone.
            </p>
            <div className="confirm-modal-card__actions">
              <button className="confirm-modal-card__btn-no" onClick={() => setStaffToDelete(null)}>
                Cancel
              </button>
              <button className="confirm-modal-card__btn-yes is-danger" onClick={executeDelete}>
                Delete Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
