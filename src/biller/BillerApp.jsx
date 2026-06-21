// src/biller/BillerApp.jsx
// ─────────────────────────────────────────────────────────────
// Biller Console root component.
//
// Auth: checks for a valid JWT with role === 'Biller'.
//       If absent or wrong role → shows LoginView.
//
// Layout: Mobile app-shell with a BOTTOM tab bar:
//   🏠 Floor    — Dine-in order entry (reuses GetOrderView)
//   🛵 Takeaway — Takeaway order entry (new TakeawayView)
//   📋 Orders   — Active orders (reuses OrdersView)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { getToken, clearToken, ordersApi, saveToken } from '../waiter/api/index.js';
import LoginView          from '../waiter/views/LoginView.jsx';
import GetOrderView       from '../waiter/views/GetOrderView.jsx';
import OrdersView         from '../waiter/views/OrdersView.jsx';
import TakeawayView       from './views/TakeawayView.jsx';
import BillerHistoryView  from './views/BillerHistoryView.jsx';

/** Decode a JWT payload without a library */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

const TABS = [
  { id: 'floor',    label: 'Floor',    icon: '🏠' },
  { id: 'takeaway', label: 'Takeaway', icon: '🛵' },
  { id: 'orders',   label: 'Orders',   icon: '📋' },
  { id: 'history',  label: 'History',  icon: '🕐' },
];

export default function BillerApp() {
  const [token,       setToken]       = useState(() => getToken());
  const [user,        setUser]        = useState(() => {
    const t = getToken();
    return t ? decodeToken(t) : null;
  });
  const [activeTab,   setActiveTab]   = useState('takeaway');
  const [activeOrders, setActiveOrders] = useState([]);
  const [occupiedTableIds, setOccupiedTableIds] = useState(new Set());
  const [getOrderParams,   setGetOrderParams]   = useState(null);

  // Derive occupied table IDs whenever activeOrders changes
  useEffect(() => {
    const ids = new Set(
      activeOrders
        .filter((o) => o.orderType !== 'Takeaway')
        .map((o) => o.tableId?._id ?? o.tableId)
        .filter(Boolean)
    );
    setOccupiedTableIds(ids);
  }, [activeOrders]);

  const fetchActiveOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await ordersApi.getActive();
      setActiveOrders(res.data ?? []);
    } catch (err) {
      console.error('Failed to fetch active orders:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 15000);
    return () => clearInterval(interval);
  }, [token, fetchActiveOrders]);

  // Handle auth-expiry events from the API layer
  useEffect(() => {
    const handler = () => handleLogout();
    window.addEventListener('rr:auth-expired', handler);
    return () => window.removeEventListener('rr:auth-expired', handler);
  }, []);

  // ── Auth handlers ─────────────────────────────────────────
  const handleLogin = (tok, userObj) => {
    setToken(tok);
    setUser(userObj);
  };

  const handleLogout = () => {
    clearToken();
    setToken(null);
    setUser(null);
    setActiveTab('takeaway');
  };

  // ── Gate: must be logged in as Biller ────────────────────
  if (!token || !user) {
    return <LoginView onLogin={handleLogin} />;
  }

  // If a non-Biller somehow ends up here, redirect to their console
  if (user.role === 'Admin') {
    window.location.href = '/admin';
    return null;
  }
  if (user.role === 'Waiter') {
    window.location.href = '/floor';
    return null;
  }

  // ── Edit existing order (from Orders tab) ─────────────────
  const handleOrdersAddItems = (order) => {
    setGetOrderParams({
      table:    order.tableId,
      customer: {
        name:           order.customerName,
        phone:          order.customerPhone || '',
        numberOfPeople: order.numberOfPeople || 1,
      },
      step:          2,
      existingItems: order.items,
      orderId:       order._id,
    });
    setActiveTab('floor');
  };

  // Count active orders for the badge
  const orderCount = activeOrders.length;

  return (
    <div className="app-shell">
      {/* ── Fixed top header ── */}
      <header className="header">
        <div className="header__brand">
          <span className="header__name">Al Hameed Restaurant</span>
          <span className="header__sub">
            {activeTab === 'floor'    && '🏠 Dine-in'}
            {activeTab === 'takeaway' && '🛵 Takeaway'}
            {activeTab === 'orders'   && '📋 Active Orders'}
            {activeTab === 'history'  && '🕐 Past Orders'}
          </span>
        </div>

        {/* Logout button */}
        <button
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--r-full)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={handleLogout}
          aria-label="Logout"
        >
          ← Logout
        </button>
      </header>

      {/* ── Main content area ── */}
      <main className="main-content" style={{ paddingBottom: '72px' }}>
        {activeTab === 'floor' && (
          <GetOrderView
            key="biller-floor"
            occupiedTableIds={occupiedTableIds}
            activeOrders={activeOrders}
            onRefreshOrders={fetchActiveOrders}
            initialParams={getOrderParams}
            onResetParams={() => setGetOrderParams(null)}
            orderType="Dine-in"
          />
        )}

        {activeTab === 'takeaway' && (
          <TakeawayView
            key="biller-takeaway"
            onRefreshOrders={fetchActiveOrders}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            key="biller-orders"
            onOrdersChange={setActiveOrders}
            onAddItems={handleOrdersAddItems}
            user={user}
          />
        )}

        {activeTab === 'history' && (
          <BillerHistoryView key="biller-history" />
        )}
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 1000,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Biller navigation"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badge    = tab.id === 'orders' && orderCount > 0 ? orderCount : null;
          return (
            <button
              key={tab.id}
              onClick={() => { setGetOrderParams(null); setActiveTab(tab.id); }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                color: isActive ? 'var(--accent)' : 'var(--text-dim)',
                transition: 'color 0.2s',
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Top indicator bar */}
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: 3,
                  borderRadius: '0 0 4px 4px',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              />
              {/* Badge for orders */}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{tab.icon}</span>
                {badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      minWidth: 18,
                      height: 18,
                      borderRadius: '99px',
                      background: 'var(--danger)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
