// frontend/src/admin/AdminApp.jsx
// Root component — auth gate + sidebar shell + view router.
import { useState, useEffect } from 'react';
import { getToken, clearToken } from './api/index.js';
import LoginView          from './views/LoginView.jsx';
import DashboardView      from './views/DashboardView.jsx';
import LiveOrdersView     from './views/LiveOrdersView.jsx';
import BlueprintView      from './views/BlueprintView.jsx';
import BillingView        from './views/BillingView.jsx';
import GstView            from './views/GstView.jsx';
import MenuView           from './views/MenuView.jsx';
import WaitersView        from './views/WaitersView.jsx';
import SalesView          from './views/SalesView.jsx';
import TodayHistoryView   from './views/TodayHistoryView.jsx';
import Sidebar            from './components/Sidebar.jsx';

function decodeToken(token) {
  try {
    const p = token.split('.')[1];
    return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
}

const VIEWS = {
  dashboard:     DashboardView,
  liveorders:    LiveOrdersView,
  blueprint:     BlueprintView,
  billing:       BillingView,
  todayhistory:  TodayHistoryView,
  gst:           GstView,
  menu:          MenuView,
  waiters:       WaitersView,
  sales:         SalesView,
};

export default function AdminApp() {
  const [token,       setToken]       = useState(() => getToken());
  const [user,        setUser]        = useState(() => { const t = getToken(); return t ? decodeToken(t) : null; });
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const handle = () => handleLogout();
    window.addEventListener('rr:auth-expired', handle);
    return () => window.removeEventListener('rr:auth-expired', handle);
  }, []);

  const handleLogin = (tok, userObj) => { setToken(tok); setUser(userObj); };
  const handleLogout = () => { clearToken(); setToken(null); setUser(null); setCurrentView('dashboard'); };

  if (!token || !user || user.role !== 'Admin') {
    return <LoginView onLogin={handleLogin} />;
  }

  const ActiveView = VIEWS[currentView] ?? DashboardView;

  return (
    <div className="admin-shell">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      <div className="main-area">
        <ActiveView key={currentView} />
      </div>
    </div>
  );
}
