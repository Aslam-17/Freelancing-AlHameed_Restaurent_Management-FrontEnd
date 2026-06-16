// src/api/index.js
// ─────────────────────────────────────────────────────────────
// Centralised fetch wrapper.
// VITE_API_URL is set in client/.env (defaults to localhost:5000/api).
// All calls automatically attach the stored JWT.
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'rr_token';

// ── Token helpers ──────────────────────────────────────────────
export const getToken  = ()           => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token)      => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = ()          => localStorage.removeItem(TOKEN_KEY);

// ── Core request helper ────────────────────────────────────────
const request = async (method, path, body = null) => {
  const token = getToken();

  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body !== null && { body: JSON.stringify(body) }),
  };

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch {
    throw new Error('Network error — is the server running?');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Handle expired token — clear it so the app forces re-login
    if (res.status === 401 || res.status === 403) {
      clearToken();
      window.dispatchEvent(new Event('rr:auth-expired'));
    }
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
};

// ── Auth ───────────────────────────────────────────────────────
export const authApi = {
  login: (credentials) => request('POST', '/auth/login', credentials),
};

// ── Tables ────────────────────────────────────────────────────
export const tablesApi = {
  getAll: () => request('GET', '/tables'),
};

// ── Menu ──────────────────────────────────────────────────────
export const menuApi = {
  getAll: () => request('GET', '/menu?available=true'),
};

// ── Orders ────────────────────────────────────────────────────
export const ordersApi = {
  create:    (data) => request('POST', '/orders', data),
  getActive: ()     => request('GET',  '/orders/active'),
  complete:  (id)   => request('POST', `/orders/${id}/complete`),
};

// ── Bills (waiter access — today's completed orders) ─────────
export const billsApi = {
  getToday: (search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request('GET', `/bills/today${qs}`);
  },
};

