// src/components/HamburgerMenu.jsx
// ─────────────────────────────────────────────────────────────
// Slide-in navigation drawer activated by the hamburger button.
//
// Props:
//   isOpen      — boolean
//   onClose     — () => void
//   currentView — 'get-order' | 'orders'
//   onNavigate  — (view) => void
//   user        — { username, role } from JWT payload
//   orderCount  — number of active orders (for badge)
//   onLogout    — () => void
// ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { view: 'get-order', icon: '🍽️', label: 'Get Order',      desc: 'Take a new order' },
  { view: 'orders',    icon: '📋', label: 'Orders',          desc: 'Active floor orders' },
  { view: 'history',   icon: '📜', label: "Today's History", desc: "Today's completed orders" },
];

export default function HamburgerMenu({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  user,
  orderCount = 0,
  onLogout,
}) {
  if (!isOpen) return null;

  const handleNavigate = (view) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="nav-overlay" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <nav className="nav-drawer" role="navigation" aria-label="Main navigation">
        {/* Header */}
        <div className="nav-drawer__header">
          <div className="nav-drawer__logo">🍛</div>
          <div className="nav-drawer__title">Al Hameed Restaurant</div>
          {user && (
            <div className="nav-drawer__user">
              <span className="nav-drawer__role-badge">{user.role}</span>
              <span className="nav-drawer__username">@{user.username}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="nav-drawer__nav">
          {NAV_ITEMS.map(({ view, icon, label }) => (
            <button
              key={view}
              className={`nav-item ${currentView === view ? 'is-active' : ''}`}
              onClick={() => handleNavigate(view)}
              aria-current={currentView === view ? 'page' : undefined}
            >
              <span className="nav-item__icon">{icon}</span>
              <span className="nav-item__label">{label}</span>
              {/* Badge on Orders */}
              {view === 'orders' && orderCount > 0 && (
                <span className="nav-item__badge">{orderCount > 99 ? '99+' : orderCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer / Logout */}
        <div className="nav-drawer__footer">
          <button className="btn-logout" onClick={onLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
