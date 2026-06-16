// frontend/src/admin/components/Sidebar.jsx

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { view: 'dashboard',    icon: '📊', label: 'Dashboard' },
      { view: 'liveorders',   icon: '🔴', label: 'Live Orders' },
      { view: 'todayhistory', icon: '📜', label: "Today's History" },
    ],
  },
  {
    label: 'Management',
    items: [
      { view: 'menu', icon: '🍽️', label: 'Menu Items' },
      { view: 'blueprint', icon: '🗺️', label: 'Floor Plan' },
      { view: 'waiters', icon: '👤', label: 'Waiters' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { view: 'billing', icon: '🧾', label: 'Billing' },
      { view: 'sales',   icon: '📈', label: 'Food Sales' },
      { view: 'gst',     icon: '⚙️', label: 'GST Settings' },
    ],
  },
];

export default function Sidebar({ currentView, onNavigate, user, onLogout }) {
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'AD';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">🍛</div>
        <div className="sidebar__app-name">Al Hameed Restaurant</div>
        <div className="sidebar__app-sub">Admin Console</div>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label}>
            <div className="sidebar__section-label">{label}</div>
            {items.map(({ view, icon, label: itemLabel }) => (
              <button
                key={view}
                className={`nav-link ${currentView === view ? 'is-active' : ''}`}
                onClick={() => onNavigate(view)}
                aria-current={currentView === view ? 'page' : undefined}
              >
                <span className="nav-link__icon">{icon}</span>
                <span className="nav-link__label">{itemLabel}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__username">@{user?.username}</div>
            <div className="sidebar__role">{user?.role}</div>
          </div>
        </div>
        <button className="btn-logout-sidebar" onClick={onLogout}>
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
