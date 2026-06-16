// admin/src/components/AnalyticsChart.jsx
// ─────────────────────────────────────────────────────────────
// Pure SVG bar chart for daily revenue breakdown.
// Props:
//   data — [{ _id: "2026-06-14", totalRevenue: 5200, billCount: 8 }]
// ─────────────────────────────────────────────────────────────

const VB_W = 800;
const VB_H = 200;
const PAD  = { top: 16, right: 16, bottom: 48, left: 72 };
const AREA = {
  w: VB_W - PAD.left - PAD.right,
  h: VB_H - PAD.top  - PAD.bottom,
};

const fmt = (n) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(0)}K`
  : `₹${n}`;

const shortDate = (str) => {
  const d = new Date(str);
  return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`;
};

export default function AnalyticsChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="loading-center" style={{ minHeight: 200 }}>
        <span style={{ opacity: .4, fontSize: '2rem' }}>📊</span>
        <span className="text-dim">No data for this period</span>
      </div>
    );
  }

  const maxRev   = Math.max(...data.map((d) => d.totalRevenue), 1);
  const barCount = data.length;
  const barW     = Math.max(4, AREA.w / barCount - 4);
  const step     = AREA.w / barCount;

  // Y-axis gridlines at 0%, 25%, 50%, 75%, 100% of max
  const yLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y:     PAD.top + AREA.h * (1 - pct),
    label: fmt(maxRev * pct),
  }));

  return (
    <div className="chart-container">
      <svg
        className="chart-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Daily revenue bar chart"
      >
        {/* Y-axis gridlines */}
        {yLines.map(({ y, label }) => (
          <g key={y}>
            <line
              x1={PAD.left} y1={y}
              x2={VB_W - PAD.right} y2={y}
              stroke="rgba(255,255,255,.05)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="rgba(148,163,184,.5)"
            >
              {label}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barH  = (d.totalRevenue / maxRev) * AREA.h;
          const x     = PAD.left + i * step + (step - barW) / 2;
          const y     = PAD.top  + AREA.h - barH;
          const isZero = d.totalRevenue === 0;

          return (
            <g key={d._id}>
              {/* Bar */}
              <rect
                x={x} y={isZero ? y - 1 : y}
                width={barW}
                height={isZero ? 2 : barH}
                rx={2}
                fill={isZero ? 'rgba(255,255,255,.06)' : 'url(#barGrad)'}
              />

              {/* Date label (show every other if cramped) */}
              {(barCount <= 15 || i % 2 === 0) && (
                <text
                  x={x + barW / 2}
                  y={PAD.top + AREA.h + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="rgba(148,163,184,.6)"
                  transform={barCount > 20 ? `rotate(-30, ${x + barW / 2}, ${PAD.top + AREA.h + 14})` : undefined}
                >
                  {shortDate(d._id)}
                </text>
              )}

              {/* Tooltip value on top */}
              {!isZero && barH > 20 && (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={8}
                  fill="rgba(249,115,22,.8)"
                >
                  {fmt(d.totalRevenue)}
                </text>
              )}
            </g>
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f97316" stopOpacity=".9" />
            <stop offset="100%" stopColor="#f97316" stopOpacity=".35" />
          </linearGradient>
        </defs>

        {/* X-axis baseline */}
        <line
          x1={PAD.left}
          y1={PAD.top + AREA.h}
          x2={VB_W - PAD.right}
          y2={PAD.top + AREA.h}
          stroke="rgba(255,255,255,.1)"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
