// admin/src/views/LoginView.jsx
// ─────────────────────────────────────────────────────────────
// Admin console login screen.
//
// Role selector:
//   • Waiter (left)  — immediately redirects to /floor (waiter SPA)
//   • Admin  (right) — active by default, shows credentials form
//
// Props:
//   onLogin — (token, user) => void
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { authApi, saveToken } from '../api/index.js';

export default function LoginView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // ── Waiter tab → immediate redirect to waiter SPA ────────
  const handleWaiterClick = () => {
    window.location.href = '/floor';
  };

  // ── Admin login submit ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ username: username.trim().toLowerCase(), password });

      // Enforce Admin-only access to this console
      if (res.user?.role !== 'Admin') {
        setError('Access denied. This console is for Admins only.');
        setLoading(false);
        return;
      }
      saveToken(res.token);
      onLogin(res.token, res.user);
    } catch (e) {
      setError(e.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── Branding ── */}
        <div className="login-card__logo">
          <div className="login-card__icon">🍛</div>
          <div className="login-card__title">
            <h1>Admin Console</h1>
            <p>Al Hameed Restaurant Management</p>
          </div>
        </div>

        {/* ── Role Selector ── */}
        <div className="role-selector">
          {/* Waiter → redirect immediately */}
          <button
            id="admin-role-waiter-btn"
            type="button"
            className="role-selector__redirect"
            onClick={handleWaiterClick}
            aria-label="Go to Waiter portal"
          >
            <span className="role-selector__icon">🍽️</span>
            <span>Waiter</span>
            <span className="role-selector__redirect-arrow">→</span>
          </button>

          {/* Admin → active pill */}
          <div className="role-selector__active" aria-current="true">
            <span className="role-selector__icon">🔑</span>
            <span>Admin</span>
          </div>
        </div>

        {/* ── Role hint ── */}
        <p className="login-role-hint">
          Select <strong>Waiter</strong> to open the waiter portal.
        </p>

        {/* ── Error banner ── */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>{error}
          </div>
        )}

        {/* ── Admin credentials form ── */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-user">Username</label>
            <input
              id="admin-user"
              className="form-input"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-pass">Password</label>
            <input
              id="admin-pass"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            id="admin-login-submit"
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading || !username.trim() || !password}
            style={{ marginTop: '.5rem' }}
          >
            {loading ? <><span className="spinner" /> Logging in…</> : '🔑 Login as Admin'}
          </button>
        </form>

        <p className="text-dim" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.78rem' }}>
          Waiter accounts cannot access this console.
        </p>
      </div>
    </div>
  );
}
