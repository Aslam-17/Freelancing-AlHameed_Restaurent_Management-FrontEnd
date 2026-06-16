// admin/src/components/GstSettingsForm.jsx
// ─────────────────────────────────────────────────────────────
// Fetches the current GST % and provides a form to update it.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { settingsApi } from '../api/index.js';

export default function GstSettingsForm() {
  const [currentGst, setCurrentGst] = useState(null);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');

  // Fetch current GST on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await settingsApi.get();
        const pct = res.data?.currentGstPercentage ?? 5;
        setCurrentGst(pct);
        setInput(String(pct));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const val = parseFloat(input);
    if (isNaN(val) || val < 0 || val > 100) {
      setError('Enter a valid percentage between 0 and 100.');
      return;
    }
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await settingsApi.updateGst(val);
      setCurrentGst(val);
      setSuccess(`GST updated to ${val}% successfully.`);
      setTimeout(() => setSuccess(''), 3500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <span className="panel__title">⚙️ GST Configuration</span>
        {!loading && currentGst !== null && (
          <span className="badge badge-muted">Current: {currentGst}%</span>
        )}
      </div>
      <div className="panel__body">
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            <span className="alert-icon">✅</span>{success}
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span className="alert-icon">⚠️</span>{error}
          </div>
        )}

        <form className="gst-form" onSubmit={handleSave} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="gst-pct">
              New GST Percentage <span>*</span>
            </label>
            <input
              id="gst-pct"
              className="form-input"
              type="number"
              min={0} max={100} step={0.5}
              placeholder={loading ? 'Loading…' : 'e.g. 18'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ maxWidth: 200 }}
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving || loading}
          >
            {saving ? <><span className="spinner" /> Saving…</> : '💾 Save GST'}
          </button>
        </form>

        <p className="text-dim" style={{ marginTop: '.75rem' }}>
          This GST % is applied globally when a waiter finalises (completes) an order.
          It takes effect immediately for all new completions.
        </p>
      </div>
    </div>
  );
}
