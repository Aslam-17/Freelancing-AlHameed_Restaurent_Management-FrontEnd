// frontend/src/App.jsx
// ─────────────────────────────────────────────────────────────
// Root router — separates the three sub-applications:
//
//   /         → redirect to /floor
//   /floor/*  → Waiter SPA  (mobile, single-column)
//   /admin/*  → Admin Console (desktop, sidebar layout)
//   /biller/* → Biller Console (mobile, bottom-tab layout)
//
// Each app manages its own auth state and internal navigation.
// ─────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WaiterApp from './waiter/WaiterApp.jsx';
import AdminApp  from './admin/AdminApp.jsx';
import BillerApp from './biller/BillerApp.jsx';

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

        {/* Biller Console — mobile, bottom-tab layout */}
        <Route
          path="/biller/*"
          element={
            <div className="waiter-root">
              <BillerApp />
            </div>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/floor" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

