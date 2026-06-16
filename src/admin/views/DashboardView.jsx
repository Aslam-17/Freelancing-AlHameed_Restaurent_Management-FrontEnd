// frontend/src/admin/views/DashboardView.jsx
// Revenue analytics overview — stat cards + daily bar chart.
// Live Orders and GST Settings have moved to their own sidebar sections.
import { useState, useEffect } from 'react';
import { billsApi, ordersApi } from '../api/index.js';
import StatCard       from '../components/StatCard.jsx';
import AnalyticsChart from '../components/AnalyticsChart.jsx';

export default function DashboardView() {
  const [analytics,  setAnalytics]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [liveCount,  setLiveCount]  = useState(null); // quick live count badge

  const fetchAnalytics = async () => {
    setRefreshing(true);
    setError('');
    try {
      const [anaRes, ordRes] = await Promise.all([
        billsApi.getAnalytics(),
        ordersApi.getActive(),
      ]);
      setAnalytics(anaRes.data);
      setLiveCount((ordRes.data ?? []).length);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const a = analytics ?? {};

  return (
    <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <div className="page-header__breadcrumb">Admin › Dashboard</div>
          <div className="page-header__title">📊 Dashboard</div>
        </div>
        <div className="page-header__actions">
          {liveCount !== null && liveCount > 0 && (
            <span className="badge badge-accent">🔴 {liveCount} live</span>
          )}
          <button
            className={`btn-icon ${refreshing ? 'spinning' : ''}`}
            onClick={fetchAnalytics}
            title="Refresh"
          >↺</button>
        </div>
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <span className="alert-icon">⚠️</span>{error}
          </div>
        )}

        {/* Revenue cards */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard variant="today"  label="Today"      amount={a.today?.totalRevenue}     count={a.today?.billCount}     loading={loading} />
          <StatCard variant="week"   label="This Week"  amount={a.thisWeek?.totalRevenue}  count={a.thisWeek?.billCount}  loading={loading} />
          <StatCard variant="month"  label="This Month" amount={a.thisMonth?.totalRevenue} count={a.thisMonth?.billCount} loading={loading} />
          <StatCard variant="year"   label="This Year"  amount={a.thisYear?.totalRevenue}  count={a.thisYear?.billCount}  loading={loading} />
        </div>

        {/* Daily chart */}
        <div className="panel">
          <div className="panel__header">
            <span className="panel__title">📈 Daily Revenue — This Month</span>
            {a.dailyBreakdown?.length > 0 && (
              <span className="badge badge-muted">{a.dailyBreakdown.length} days</span>
            )}
          </div>
          <div className="panel__body">
            {loading
              ? <div className="loading-center" style={{ minHeight: 200 }}><span className="spinner dark" /></div>
              : <AnalyticsChart data={a.dailyBreakdown ?? []} />
            }
          </div>
        </div>

        {/* Quick-links */}
        {!loading && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="panel" style={{ flex: 1, minWidth: 200, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', fontSize: '.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>👉 Use the sidebar to navigate to <strong style={{ color: 'var(--text)' }}>Live Orders</strong>, <strong style={{ color: 'var(--text)' }}>Menu Management</strong>, <strong style={{ color: 'var(--text)' }}>Waiter Accounts</strong>, <strong style={{ color: 'var(--text)' }}>Billing</strong>, and <strong style={{ color: 'var(--text)' }}>GST Settings</strong>.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
