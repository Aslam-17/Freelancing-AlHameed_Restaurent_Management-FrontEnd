// src/views/LoginView.jsx
// ─────────────────────────────────────────────────────────────
// Full-page login screen — shown when no JWT is in localStorage.
//
// Role selector:
//   • Waiter (default) — shows credentials form, logs into waiter SPA
//   • Admin            — immediately redirects to /admin console
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

  // ── Admin tab → immediate redirect ───────────────────────
  const handleAdminClick = () => {
    window.location.href = '/admin';
  };

  // ── Waiter login submit ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({
        username: username.trim().toLowerCase(),
        password,
      });

      // Extra guard: prevent admins from using the waiter SPA
      if (res.user?.role === 'Admin') {
        setError('Admin accounts must log in via the Admin console.');
        setLoading(false);
        return;
      }

      saveToken(res.token);
      onLogin(res.token, res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-view">
      <div className="login-card animate-scale-in">

        {/* ── Logo / Branding ── */}
        <div className="login-card__logo">
          <div className="login-card__icon">🍛</div>
          <div className="login-card__title">
            <h1>Al Hameed Restaurant</h1>
            <p>Waiter management portal</p>
          </div>
        </div>

        {/* ── Role Selector ── */}
        <div className="role-selector">
          {/* Active: Waiter pill */}
          <div className="role-selector__active" aria-current="true">
            <span className="role-selector__icon">🍽️</span>
            <span>Waiter</span>
          </div>

          {/* Redirect button for Admin */}
          <button
            id="role-admin-btn"
            type="button"
            className="role-selector__redirect"
            onClick={handleAdminClick}
            aria-label="Go to Admin console"
          >
            <span className="role-selector__icon">🔑</span>
            <span>Admin</span>
            <span className="role-selector__redirect-arrow">→</span>
          </button>
        </div>

        {/* ── Role hint ── */}
        <p className="login-role-hint">
          Select <strong>Admin</strong> to open the admin console login.
        </p>

        {/* ── Error banner ── */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* ── Waiter credentials form ── */}
        <form className="login-card__form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              className="form-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            id="login-submit-btn"
            className="btn btn-primary"
            type="submit"
            disabled={loading || !username.trim() || !password}
          >
            {loading
              ? <><span className="spinner" /> Logging in…</>
              : '🍽️ Login as Waiter'}
          </button>
        </form>

        <div className="login-card__footer">
          Al Hameed Restaurant Management System
        </div>
      </div>
    </div>
  );
}
