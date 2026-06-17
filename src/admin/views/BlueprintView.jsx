// admin/src/views/BlueprintView.jsx
// ─────────────────────────────────────────────────────────────
// Floor-plan management: SVG canvas + table CRUD form.
// Default layout button creates the 8 default tables if DB is empty.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { tablesApi } from '../api/index.js';
import BlueprintCanvas from '../components/BlueprintCanvas.jsx';
import TableForm       from '../components/TableForm.jsx';

// ── Default layout seeded when DB has no tables ───────────────
const DEFAULT_TABLES = [
  { tableNumber:1,  name:'T1', capacity:8, zone:'AC',     blueprintData:{ x:60,  y:60,  svgType:'rect' } },
  { tableNumber:2,  name:'T2', capacity:6, zone:'AC',     blueprintData:{ x:60,  y:200, svgType:'rect' } },
  { tableNumber:3,  name:'T3', capacity:5, zone:'AC',     blueprintData:{ x:260, y:60,  svgType:'rect' } },
  { tableNumber:4,  name:'T4', capacity:3, zone:'AC',     blueprintData:{ x:260, y:200, svgType:'rect' } },
  { tableNumber:5,  name:'T5', capacity:4, zone:'Non-AC', blueprintData:{ x:650, y:60,  svgType:'rect' } },
  { tableNumber:6,  name:'T6', capacity:4, zone:'Non-AC', blueprintData:{ x:800, y:60,  svgType:'rect' } },
  { tableNumber:7,  name:'T7', capacity:4, zone:'Non-AC', blueprintData:{ x:650, y:220, svgType:'rect' } },
  { tableNumber:8,  name:'T8', capacity:4, zone:'Non-AC', blueprintData:{ x:800, y:220, svgType:'rect' } },
];

export default function BlueprintView() {
  const [tables,    setTables]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [selected,  setSelected]  = useState(null); // Table | null
  const [seeding,   setSeeding]   = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);

  const fetchTables = useCallback(async () => {
    setError('');
    try {
      const res = await tablesApi.getAll();
      setTables(res.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // ── Seed default layout ───────────────────────────────────
  const triggerSeedDefault = () => {
    setShowSeedModal(true);
  };

  const executeSeedDefault = async () => {
    setShowSeedModal(false);
    setSeeding(true);
    setError('');
    try {
      for (const t of DEFAULT_TABLES) {
        await tablesApi.create(t);
      }
      await fetchTables();
    } catch (e) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  };

  // ── After form saves/deletes ──────────────────────────────
  const handleSaved = () => { fetchTables(); setSelected(null); };
  const handleDeleted = (id) => {
    setTables((p) => p.filter((t) => t._id !== id));
    setSelected(null);
  };

  return (
    <>
      <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header__breadcrumb">Admin › Floor Plan</div>
          <div className="page-header__title">Floor Plan Editor</div>
        </div>
        <div className="page-header__actions">
          {tables.length === 0 && !loading && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={triggerSeedDefault}
              disabled={seeding}
            >
              {seeding ? <><span className="spinner dark" /> Creating…</> : '⚡ Init Default Layout'}
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setSelected('new')}
          >
            ➕ Add Table
          </button>
        </div>
      </div>

      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span className="alert-icon">⚠️</span>{error}
          </div>
        )}

        {loading ? (
          <div className="loading-center"><span className="spinner dark" /><span>Loading floor plan…</span></div>
        ) : (
          <div className="blueprint-layout">
            {/* ── Canvas ── */}
            <div>
              <div className="blueprint-wrapper">
                <div className="blueprint-toolbar">
                  <span className="blueprint-toolbar__title">
                    🗺️ Floor Plan
                    <span className="badge badge-muted">{tables.length} tables</span>
                  </span>
                  <span className="blueprint-toolbar__hint">
                    Drag tables to reposition · Click to select
                  </span>
                </div>

                <BlueprintCanvas
                  tables={tables}
                  selectedId={typeof selected === 'object' && selected !== null ? selected._id : null}
                  onSelect={(t) => setSelected(t)}
                  onPositionSaved={fetchTables}
                />
              </div>

              {/* Table list below canvas */}
              {tables.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>
                    All Tables
                  </div>
                  <div className="table-list">
                    {tables.map((t) => (
                      <div
                        key={t._id}
                        className={`table-list__item ${selected?._id === t._id ? 'is-selected' : ''}`}
                        onClick={() => setSelected(selected?._id === t._id ? null : t)}
                      >
                        <div className="table-list__badge">{t.tableNumber}</div>
                        <div className="table-list__info">
                          <div className="table-list__name">{t.name || `Table ${t.tableNumber}`}</div>
                          <div className="table-list__meta">{t.capacity}-seater · {t.zone}</div>
                        </div>
                        <span className={`zone-pill ${t.zone === 'AC' ? 'ac' : 'non-ac'}`}>{t.zone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right side: form ── */}
            <div>
              {selected === 'new' ? (
                <TableForm
                  table={null}
                  onSaved={handleSaved}
                  onDelete={handleDeleted}
                  onCancel={() => setSelected(null)}
                />
              ) : selected ? (
                <TableForm
                  table={selected}
                  onSaved={handleSaved}
                  onDelete={handleDeleted}
                  onCancel={() => setSelected(null)}
                />
              ) : (
                <div className="table-form-panel">
                  <div className="table-form-panel__header">ℹ️ Instructions</div>
                  <div className="table-form-panel__body" style={{ color: 'var(--text-muted)', fontSize: '.85rem', lineHeight: 1.7 }}>
                    <p>• <strong>Click</strong> a table on the canvas to select and edit it.</p>
                    <p>• <strong>Drag</strong> a table to reposition it — the new position is saved automatically.</p>
                    <p>• Use <strong>➕ Add Table</strong> to create a new table.</p>
                    <p>• If the floor is empty, click <strong>⚡ Init Default Layout</strong> to create the standard 8-table setup.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showSeedModal && (
        <div className="modal-overlay" onClick={() => setShowSeedModal(false)}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-card__icon" style={{ color: 'var(--accent)' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="confirm-modal-card__title">Initialize Default Layout?</h3>
            <p className="confirm-modal-card__text">
              This will create the default 8 tables. Continue?
            </p>
            <div className="confirm-modal-card__actions">
              <button className="confirm-modal-card__btn-no" onClick={() => setShowSeedModal(false)}>
                Cancel
              </button>
              <button className="confirm-modal-card__btn-yes" style={{ background: 'var(--accent)', color: 'white' }} onClick={executeSeedDefault}>
                Initialize
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
