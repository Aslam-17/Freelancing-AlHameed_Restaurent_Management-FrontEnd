// src/components/TableBlueprint.jsx
// ─────────────────────────────────────────────────────────────
// Fetches all tables and renders them grouped by zone (AC / Non-AC).
// Highlights occupied tables (cross-referenced against active orders).
//
// Props:
//   selectedTable     — currently selected Table object | null
//   occupiedTableIds  — Set<string> of table _id values with active orders
//   onSelect          — (table) => void
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { tablesApi } from '../api/index.js';
import TableSVG from './TableSVG.jsx';

export default function TableBlueprint({ selectedTable, occupiedTableIds, onSelect }) {
  const [tables,  setTables]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await tablesApi.getAll();
        if (!cancelled) setTables(res.data ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner dark" />
        <span>Loading floor plan…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <span style={{ color: 'var(--danger)' }}>{error}</span>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🪑</div>
        <div className="empty-state__title">No tables configured</div>
        <div className="empty-state__text">
          Ask your admin to add tables from the management panel.
        </div>
      </div>
    );
  }

  // Group by zone
  const zones = {};
  tables.forEach((t) => {
    const zone = t.zone ?? 'Other';
    if (!zones[zone]) zones[zone] = [];
    zones[zone].push(t);
  });

  const getStatus = (table) => {
    if (selectedTable?._id === table._id) return 'selected';
    if (occupiedTableIds?.has(table._id))  return 'occupied';
    return 'free';
  };

  return (
    <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      {Object.entries(zones).map(([zone, zTables]) => (
        <div className="zone-section" key={zone}>
          {/* Zone label */}
          <div className={`zone-label ${zone === 'AC' ? 'ac' : 'non-ac'}`}>
            <span className="zone-label__dot" />
            {zone} Zone — {zTables.length} table{zTables.length > 1 ? 's' : ''}
          </div>

          {/* Table grid */}
          <div className="table-grid">
            {zTables.map((table) => {
              const status = getStatus(table);
              return (
                <button
                  key={table._id}
                  className={`table-card ${status === 'selected' ? 'is-selected' : ''} ${status === 'occupied' ? 'is-occupied' : ''}`}
                  onClick={() => onSelect(table)}
                  aria-label={`Select ${table.name || `Table ${table.tableNumber}`}`}
                >
                  {/* Status indicator dot */}
                  <span className={`table-card__status ${status}`} />

                  {/* SVG */}
                  <div style={{ width: '100%', maxHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TableSVG
                      capacity={table.capacity}
                      status={status}
                      zone={zone}
                    />
                  </div>

                  {/* Info */}
                  <div className="table-card__info">
                    <div className="table-card__name">
                      {table.name || `Table ${table.tableNumber}`}
                    </div>
                    <div className="table-card__cap">
                      {table.capacity} seats · {zone}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
