// admin/src/components/BlueprintCanvas.jsx
// ─────────────────────────────────────────────────────────────
// Interactive SVG floor-plan editor.
// • Renders tables as draggable SVG shapes sized by capacity.
// • Click to select a table (highlights it, emits onSelect).
// • Drag to reposition — saves updated x,y to backend on pointer-up.
// • Zone colour bands: AC (indigo tint) / Non-AC (emerald tint).
//
// Props:
//   tables       — Table[] from API
//   selectedId   — string | null
//   onSelect     — (table | null) => void
//   onPositionSaved — () => void (triggers refetch in parent)
// ─────────────────────────────────────────────────────────────
import { useRef, useState, useCallback } from 'react';
import { tablesApi } from '../api/index.js';

// SVG canvas viewport dimensions
const VB_W = 1200;
const VB_H = 580;
const ZONE_SPLIT = 590; // x-divider between AC and Non-AC

// ── Table dimensions by capacity ──────────────────────────────
function tableSize(capacity) {
  switch (capacity) {
    case 8:  return { w: 160, h: 80 };
    case 6:  return { w: 130, h: 70 };
    case 5:  return { w: 110, h: 65 };
    case 4:  return { w: 90,  h: 90 };
    case 3:  return { w: 80,  h: 55 };
    default: return { w: 90,  h: 90 };
  }
}

// ── Seat positions relative to table rect ─────────────────────
function seats(capacity, w, h) {
  const r = 6;
  const cx = w / 2, cy = h / 2;
  switch (capacity) {
    case 3:  return [{ x: cx, y: -r }, { x: r, y: h + r }, { x: w - r, y: h + r }];
    case 4:  return [{ x: cx, y: -r }, { x: cx, y: h + r }, { x: -r, y: cy }, { x: w + r, y: cy }];
    case 5:  return [{ x: w * .35, y: -r }, { x: w * .65, y: -r }, { x: w * .35, y: h + r }, { x: w * .65, y: h + r }, { x: w + r, y: cy }];
    case 6:  return [{ x: w * .35, y: -r }, { x: w * .65, y: -r }, { x: w * .35, y: h + r }, { x: w * .65, y: h + r }, { x: -r, y: cy }, { x: w + r, y: cy }];
    case 8:  return [
      { x: w * .25, y: -r }, { x: cx, y: -r }, { x: w * .75, y: -r },
      { x: w * .25, y: h + r }, { x: cx, y: h + r }, { x: w * .75, y: h + r },
      { x: -r, y: cy }, { x: w + r, y: cy },
    ];
    default: return [{ x: cx, y: -r }, { x: cx, y: h + r }, { x: -r, y: cy }, { x: w + r, y: cy }];
  }
}

// ── Single table SVG group ────────────────────────────────────
function TableShape({ table, pos, isSelected, isDragging, onPointerDown, onClick }) {
  const { w, h } = tableSize(table.capacity);
  const seatList  = seats(table.capacity, w, h);
  const zone      = table.zone ?? 'AC';
  const isAC      = zone === 'AC';

  const tableColor  = isSelected
    ? '#f97316'
    : isDragging ? '#f59e0b'
    : isAC ? '#3730a3' : '#065f46';

  const tableFill   = isSelected
    ? 'rgba(249,115,22,.25)'
    : isAC ? 'rgba(55,48,163,.2)' : 'rgba(6,95,70,.2)';

  const seatColor   = isSelected ? '#f97316'
    : isAC ? '#818cf8' : '#34d399';

  const label = table.name || `T${table.tableNumber}`;

  return (
    <g
      transform={`translate(${pos.x},${pos.y})`}
      onPointerDown={(e) => onPointerDown(e, table)}
      onClick={() => onClick(table)}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Glow ring on selected */}
      {isSelected && (
        <rect
          x={-4} y={-4} width={w + 8} height={h + 8}
          rx={10} fill="none"
          stroke="#f97316" strokeWidth={2} strokeDasharray="6 3"
          opacity={.6}
        />
      )}

      {/* Seats */}
      {seatList.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={6} fill={seatColor} opacity={.75} />
      ))}

      {/* Table surface */}
      <rect
        x={0} y={0} width={w} height={h} rx={6}
        fill={tableFill}
        stroke={tableColor}
        strokeWidth={isSelected ? 2 : 1.5}
      />

      {/* Inner highlight */}
      <rect x={4} y={4} width={w - 8} height={6} rx={3} fill="rgba(255,255,255,.05)" />

      {/* Label */}
      <text
        x={w / 2} y={h / 2 + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={700}
        fill={isSelected ? '#f97316' : 'rgba(255,255,255,.8)'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>

      {/* Capacity tag */}
      <text
        x={w / 2} y={h - 6}
        textAnchor="middle"
        fontSize={8}
        fill="rgba(255,255,255,.4)"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {table.capacity}-seater
      </text>
    </g>
  );
}

// ── Main component ────────────────────────────────────────────
export default function BlueprintCanvas({ tables, selectedId, onSelect, onPositionSaved }) {
  const svgRef = useRef(null);

  // Local position overrides during drag (avoids touching `tables` prop)
  const [localPos, setLocalPos] = useState({});
  const [dragging, setDragging] = useState(null);
  // { tableId, origX, origY, startSVGX, startSVGY }

  // Convert client coords → SVG viewBox coords
  const toSVG = useCallback((cx, cy) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((cx - rect.left) / rect.width)  * VB_W,
      y: ((cy - rect.top)  / rect.height) * VB_H,
    };
  }, []);

  const getPos = (table) => {
    if (localPos[table._id]) return localPos[table._id];
    return { x: table.blueprintData?.x ?? 60, y: table.blueprintData?.y ?? 60 };
  };

  // ── Drag start ──────────────────────────────────────────────
  const handlePointerDown = (e, table) => {
    e.preventDefault();
    e.stopPropagation();
    svgRef.current.setPointerCapture(e.pointerId);
    const svgPt = toSVG(e.clientX, e.clientY);
    const pos   = getPos(table);
    setDragging({
      tableId:   table._id,
      origX:     pos.x,
      origY:     pos.y,
      startSVGX: svgPt.x,
      startSVGY: svgPt.y,
    });
  };

  // ── Drag move ───────────────────────────────────────────────
  const handlePointerMove = (e) => {
    if (!dragging) return;
    const svgPt = toSVG(e.clientX, e.clientY);
    const dx    = svgPt.x - dragging.startSVGX;
    const dy    = svgPt.y - dragging.startSVGY;
    const { w, h } = tableSize(
      tables.find((t) => t._id === dragging.tableId)?.capacity ?? 4
    );
    setLocalPos((prev) => ({
      ...prev,
      [dragging.tableId]: {
        x: Math.max(10, Math.min(VB_W - w - 10, dragging.origX + dx)),
        y: Math.max(10, Math.min(VB_H - h - 10, dragging.origY + dy)),
      },
    }));
  };

  // ── Drag end — persist to backend ──────────────────────────
  const handlePointerUp = async () => {
    if (!dragging) return;
    const pos = localPos[dragging.tableId];
    if (pos) {
      try {
        const table = tables.find((t) => t._id === dragging.tableId);
        await tablesApi.update(dragging.tableId, {
          blueprintData: {
            ...(table?.blueprintData ?? {}),
            x: Math.round(pos.x),
            y: Math.round(pos.y),
          },
        });
        onPositionSaved?.();
      } catch (e) {
        console.error('Failed to save position:', e.message);
      }
    }
    setDragging(null);
  };

  return (
    <div className="blueprint-canvas-wrap">
      <svg
        ref={svgRef}
        className="blueprint-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ width: '100%', minHeight: 400, touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        aria-label="Restaurant floor plan"
      >
        {/* Zone backgrounds */}
        <rect x={0}             y={0} width={ZONE_SPLIT}         height={VB_H} fill="rgba(67,56,202,.04)" />
        <rect x={ZONE_SPLIT+20} y={0} width={VB_W - ZONE_SPLIT - 20} height={VB_H} fill="rgba(16,185,129,.04)" />

        {/* Zone labels */}
        <text x={20} y={28} fontSize={12} fontWeight={700} fill="rgba(129,140,248,.5)">❄️  AC ZONE</text>
        <text x={ZONE_SPLIT + 36} y={28} fontSize={12} fontWeight={700} fill="rgba(52,211,153,.5)">🌿 NON-AC ZONE</text>

        {/* Divider */}
        <line
          x1={ZONE_SPLIT + 10} y1={10}
          x2={ZONE_SPLIT + 10} y2={VB_H - 10}
          stroke="rgba(255,255,255,.06)"
          strokeWidth={1}
          strokeDasharray="6 4"
        />

        {/* Tables */}
        {tables.map((table) => {
          const pos = getPos(table);
          return (
            <TableShape
              key={table._id}
              table={table}
              pos={pos}
              isSelected={selectedId === table._id}
              isDragging={dragging?.tableId === table._id}
              onPointerDown={handlePointerDown}
              onClick={(t) => onSelect(selectedId === t._id ? null : t)}
            />
          );
        })}

        {/* Empty hint */}
        {tables.length === 0 && (
          <text x={VB_W / 2} y={VB_H / 2} textAnchor="middle" fontSize={14} fill="rgba(255,255,255,.2)">
            No tables yet — use the form to add tables
          </text>
        )}
      </svg>
    </div>
  );
}
