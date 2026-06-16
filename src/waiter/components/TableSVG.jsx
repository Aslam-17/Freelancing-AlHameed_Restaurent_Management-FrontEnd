// src/components/TableSVG.jsx
// ─────────────────────────────────────────────────────────────
// Pure SVG representation of a dining table.
// Capacity-specific seat placements — all inline, no image assets.
//
// Props:
//   capacity  — 3 | 4 | 5 | 6 | 8
//   status    — 'free' | 'occupied' | 'selected'
//   zone      — 'AC' | 'Non-AC'  (affects accent hue)
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  free:     { table: '#1c1f28', border: '#2a2d38', seat: '#2a2d38' },
  occupied: { table: '#1c1a10', border: '#92400e', seat: '#78350f' },
  selected: { table: '#1c1208', border: '#f97316', seat: '#c2410c' },
};

const ZONE_GLOW = {
  AC:       '#818cf8',
  'Non-AC': '#34d399',
};

/** Renders a single seat circle */
const Seat = ({ cx, cy, fill, opacity = 1 }) => (
  <circle cx={cx} cy={cy} r={7} fill={fill} opacity={opacity} />
);

/**
 * Per-capacity SVG definitions.
 * Each returns { viewBox, tableRect: {x,y,w,h}, seats: [{cx,cy}] }
 */
function getLayout(capacity) {
  switch (capacity) {
    case 3:
      return {
        viewBox: '0 0 100 90',
        tableRect: { x: 20, y: 22, w: 60, h: 46, rx: 6 },
        seats: [{ cx: 50, cy: 9 }, { cx: 28, cy: 81 }, { cx: 72, cy: 81 }],
      };
    case 4:
      return {
        viewBox: '0 0 100 100',
        tableRect: { x: 15, y: 15, w: 70, h: 70, rx: 6 },
        seats: [
          { cx: 50, cy: 6 }, { cx: 50, cy: 94 },
          { cx: 6, cy: 50 }, { cx: 94, cy: 50 },
        ],
      };
    case 5:
      return {
        viewBox: '0 0 150 100',
        tableRect: { x: 20, y: 18, w: 110, h: 64, rx: 6 },
        seats: [
          { cx: 55, cy: 8 }, { cx: 95, cy: 8 },
          { cx: 55, cy: 92 }, { cx: 95, cy: 92 },
          { cx: 143, cy: 50 },
        ],
      };
    case 6:
      return {
        viewBox: '0 0 150 100',
        tableRect: { x: 20, y: 18, w: 110, h: 64, rx: 6 },
        seats: [
          { cx: 55, cy: 8 },  { cx: 95, cy: 8 },
          { cx: 55, cy: 92 }, { cx: 95, cy: 92 },
          { cx: 8,  cy: 50 }, { cx: 142, cy: 50 },
        ],
      };
    case 8:
    default:
      return {
        viewBox: '0 0 200 110',
        tableRect: { x: 20, y: 20, w: 160, h: 70, rx: 6 },
        seats: [
          { cx: 55,  cy: 8 }, { cx: 100, cy: 8 }, { cx: 145, cy: 8 },
          { cx: 55,  cy: 102 }, { cx: 100, cy: 102 }, { cx: 145, cy: 102 },
          { cx: 8,   cy: 55 }, { cx: 192, cy: 55 },
        ],
      };
  }
}

export default function TableSVG({ capacity, status = 'free', zone = 'AC' }) {
  const colors  = STATUS_COLORS[status] ?? STATUS_COLORS.free;
  const { viewBox, tableRect, seats } = getLayout(capacity);
  const { x, y, w, h, rx } = tableRect;

  // Subtle glow line along the top edge for selected/occupied
  const showGlow   = status !== 'free';
  const glowColor  = status === 'selected'
    ? '#f97316'
    : (status === 'occupied' ? '#f59e0b' : ZONE_GLOW[zone]);

  return (
    <svg
      viewBox={viewBox}
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Glow filter */}
      {showGlow && (
        <defs>
          <filter id={`glow-${capacity}-${status}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Table surface */}
      <rect
        x={x} y={y} width={w} height={h} rx={rx}
        fill={colors.table}
        stroke={colors.border}
        strokeWidth={showGlow ? 1.5 : 1}
        filter={showGlow ? `url(#glow-${capacity}-${status})` : undefined}
      />

      {/* Subtle inner highlight */}
      <rect
        x={x + 4} y={y + 4} width={w - 8} height={8} rx={3}
        fill="rgba(255,255,255,0.04)"
      />

      {/* Seats */}
      {seats.map((seat, i) => (
        <Seat
          key={i}
          cx={seat.cx}
          cy={seat.cy}
          fill={status === 'selected' ? glowColor : colors.seat}
          opacity={status === 'selected' ? 0.7 : 0.85}
        />
      ))}
    </svg>
  );
}
