// admin/src/api/index.js
// ─────────────────────────────────────────────────────────────
// Centralised fetch wrapper for the Admin Console.
// Uses VITE_API_URL from the .env file.
// ─────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'rr_admin_token';

export const getToken   = ()      => localStorage.getItem(TOKEN_KEY);
export const saveToken  = (tok)   => localStorage.setItem(TOKEN_KEY, tok);
export const clearToken = ()      => localStorage.removeItem(TOKEN_KEY);

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
    throw new Error('Network error — is the backend running?');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
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
  getAll:  ()         => request('GET',    '/tables'),
  create:  (data)     => request('POST',   '/tables', data),
  update:  (id, data) => request('PUT',    `/tables/${id}`, data),
  delete:  (id)       => request('DELETE', `/tables/${id}`),
};

// ── Orders ────────────────────────────────────────────────────
export const ordersApi = {
  getActive: () => request('GET', '/orders/active'),
};

// ── Bills ─────────────────────────────────────────────────────
export const billsApi = {
  getHistory:   (customerName) => {
    const qs = customerName ? `?customerName=${encodeURIComponent(customerName)}` : '';
    return request('GET', `/bills/history${qs}`);
  },
  getToday:     (search = '') => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request('GET', `/bills/today${qs}`);
  },
  getAnalytics: () => request('GET', '/bills/analytics'),
  getItemSales: (period = 'today') => request('GET', `/bills/item-sales?period=${period}`),
  delete:       (id) => request('DELETE', `/bills/${id}`),
};

// ── Settings ──────────────────────────────────────────────────
export const settingsApi = {
  get:       ()    => request('GET', '/settings'),
  updateGst: (pct) => request('PUT', '/settings/gst', { gstPercentage: pct }),
  updateSettings: (data) => request('PUT', '/settings/gst', data),
};

// ── Menu Items ────────────────────────────────────────────────
export const menuApi = {
  getAll:  ()         => request('GET',    '/menu'),
  create:  (data)     => request('POST',   '/menu', data),
  update:  (id, data) => request('PUT',    `/menu/${id}`, data),
  delete:  (id)       => request('DELETE', `/menu/${id}`),
};

// ── Users (Staff management) ─────────────────────────────────
export const usersApi = {
  listStaff:     ()             => request('GET',    '/users'),
  create:        (data)         => request('POST',   '/users', data),
  update:        (id, data)     => request('PUT',    `/users/${id}`, data),
  resetPassword: (id, password) => request('PUT',    `/users/${id}/password`, { password }),
  delete:        (id)           => request('DELETE', `/users/${id}`),
};
