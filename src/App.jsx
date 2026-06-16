// frontend/src/App.jsx
// ─────────────────────────────────────────────────────────────
// Root router — separates the two sub-applications:
//
//   /        → redirect to /floor
//   /floor/* → Waiter SPA  (mobile, single-column)
//   /admin/* → Admin Console (desktop, sidebar layout)
//
// Each app manages its own auth state and internal navigation.
// The wrapper divs (.waiter-root / .admin-root) provide CSS
// scoping so the two design systems don't conflict.
// ─────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WaiterApp from './waiter/WaiterApp.jsx';
import AdminApp  from './admin/AdminApp.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default → waiter floor */}
        <Route path="/" element={<Navigate to="/floor" replace />} />

        {/* Waiter SPA — mobile-first */}
        <Route
          path="/floor/*"
          element={
            <div className="waiter-root">
              <WaiterApp />
            </div>
          }
        />

        {/* Admin Console — desktop */}
        <Route
          path="/admin/*"
          element={
            <div className="admin-root">
              <AdminApp />
            </div>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/floor" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
