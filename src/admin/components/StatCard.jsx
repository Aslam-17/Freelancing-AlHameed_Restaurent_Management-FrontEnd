// admin/src/components/StatCard.jsx
// Revenue metric card for Today / Week / Month / Year.
// Props: variant ('today'|'week'|'month'|'year'), label, amount, count, loading

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0,
  }).format(n || 0);

const ICONS = { today: '📅', week: '📆', month: '🗓️', year: '📈' };

export default function StatCard({ variant = 'today', label, amount, count, loading }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        <div className="stat-card__icon">{ICONS[variant] ?? '💰'}</div>
      </div>

      {loading ? (
        <div className="stat-card__skeleton" style={{ height: '2.2rem' }} />
      ) : (
        <div className="stat-card__amount">{formatCurrency(amount)}</div>
      )}

      {loading ? (
        <div className="stat-card__skeleton" style={{ height: '.875rem', width: '60%' }} />
      ) : (
        <div className="stat-card__count">
          {count ?? 0} transaction{count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
