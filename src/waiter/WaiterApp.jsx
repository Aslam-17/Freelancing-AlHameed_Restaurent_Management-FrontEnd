// src/App.jsx
// ─────────────────────────────────────────────────────────────
// Root application component.
//
// Responsibilities:
//   • Auth gate — checks localStorage for a JWT on mount.
//     If absent → LoginView.  If present → main app.
//   • View switching between 'get-order' and 'orders'.
//   • Hamburger menu state.
//   • Maintaining occupiedTableIds so GetOrderView can colour
//     tables that already have active orders.
//   • Orders count badge in the nav.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { getToken, clearToken, ordersApi } from './api/index.js';
import LoginView    from './views/LoginView.jsx';
import GetOrderView from './views/GetOrderView.jsx';
import OrdersView   from './views/OrdersView.jsx';
import HistoryView  from './views/HistoryView.jsx';
import HamburgerMenu from './components/HamburgerMenu.jsx';

/** Decode a JWT payload without a library (base64url → JSON). */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => {
    const t = getToken();
    return t ? decodeToken(t) : null;
  });
  const [currentView, setCurrentView] = useState('get-order');
  const [menuOpen, setMenuOpen] = useState(false);

  // Active orders count — updated by OrdersView whenever it fetches
  const [activeOrders, setActiveOrders] = useState([]);
  const [occupiedTableIds, setOccupiedTableIds] = useState(new Set());
  const [getOrderParams, setGetOrderParams] = useState(null);

  // Derive occupied table IDs whenever activeOrders changes
  useEffect(() => {
    const ids = new Set(activeOrders.map((o) => o.tableId?._id ?? o.tableId).filter(Boolean));
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

  // Fetch active orders on mount and poll every 15 seconds
  useEffect(() => {
    if (!token) return;
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 15000);
    return () => clearInterval(interval);
  }, [token, fetchActiveOrders]);

  // ── Auth-expiry event (fired by api/index.js on 401/403) ──
  useEffect(() => {
    const handler = () => handleLogout();
    window.addEventListener('rr:auth-expired', handler);
    return () => window.removeEventListener('rr:auth-expired', handler);
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  const handleLogin = (tok, userObj) => {
    setToken(tok);
    setUser(userObj);
  };

  const handleLogout = () => {
    clearToken();
    setToken(null);
    setUser(null);
    setMenuOpen(false);
    setCurrentView('get-order');
  };

  const handleOrdersChange = useCallback((orders) => {
    setActiveOrders(orders);
  }, []);

  const handleOrdersAddItems = (order) => {
    setGetOrderParams({
      table: order.tableId,
      customer: { name: order.customerName, phone: order.customerPhone || '', numberOfPeople: order.numberOfPeople || 1 },
      step: 2,
      existingItems: order.items,
      orderId: order._id
    });
    setCurrentView('get-order');
  };

  // ── Auth gate ─────────────────────────────────────────────
  if (!token || !user) {
    return <LoginView onLogin={handleLogin} />;
  }

  // ── Main app shell ────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* Fixed top header */}
      <header className="header">
        {/* Hamburger */}
        <button
          className={`hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <div className="hamburger__lines">
            <span className="hamburger__line" />
            <span className="hamburger__line" />
            <span className="hamburger__line" />
          </div>
        </button>

        {/* Brand */}
        <div className="header__brand">
          <span className="header__name">Al Hameed Restaurant</span>
          <span className="header__sub">
            {currentView === 'get-order' ? '🍽️ Get Order' : '📋 Orders'}
          </span>
        </div>

        {/* Orders badge indicator in header */}
        {activeOrders.length > 0 && currentView === 'get-order' && (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '6px 10px',
              borderRadius: 'var(--r-full)',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent-glow)',
              color: 'var(--accent)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => {
              setGetOrderParams(null);
              setCurrentView('orders');
            }}
            aria-label={`${activeOrders.length} active orders`}
          >
            📋 {activeOrders.length}
          </button>
        )}
      </header>

      {/* Navigation drawer */}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentView={currentView}
        onNavigate={(view) => {
          setGetOrderParams(null);
          setCurrentView(view);
        }}
        user={user}
        orderCount={activeOrders.length}
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <main className="main-content">
        {currentView === 'get-order' && (
          <GetOrderView
            key="get-order"
            occupiedTableIds={occupiedTableIds}
            activeOrders={activeOrders}
            onRefreshOrders={fetchActiveOrders}
            initialParams={getOrderParams}
            onResetParams={() => setGetOrderParams(null)}
          />
        )}

        {currentView === 'orders' && (
          <OrdersView
            key="orders"
            onOrdersChange={handleOrdersChange}
            onAddItems={handleOrdersAddItems}
          />
        )}

        {currentView === 'history' && (
          <HistoryView key="history" />
        )}
      </main>
    </div>
  );
}
