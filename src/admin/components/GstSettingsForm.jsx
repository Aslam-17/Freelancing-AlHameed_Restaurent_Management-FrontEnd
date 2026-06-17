// admin/src/components/GstSettingsForm.jsx
// ─────────────────────────────────────────────────────────────
// Fetches the current GST % and provides a form to update it.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { settingsApi } from '../api/index.js';

export default function GstSettingsForm() {
  const [currentGst, setCurrentGst] = useState(null);
  const [currentAcCharge, setCurrentAcCharge] = useState(null);
  const [inputGst,      setInputGst]      = useState('');
  const [inputAcCharge, setInputAcCharge] = useState('');
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
        const ac = res.data?.acChargePerPerson ?? 0;
        setCurrentGst(pct);
        setInputGst(String(pct));
        setCurrentAcCharge(ac);
        setInputAcCharge(String(ac));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const valGst = parseFloat(inputGst);
    const valAc = parseFloat(inputAcCharge);
    if (isNaN(valGst) || valGst < 0 || valGst > 100) {
      setError('Enter a valid GST percentage between 0 and 100.');
      return;
    }
    if (isNaN(valAc) || valAc < 0) {
      setError('Enter a valid AC Charge amount.');
      return;
    }
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await settingsApi.updateSettings({ gstPercentage: valGst, acChargePerPerson: valAc });
      setCurrentGst(valGst);
      setCurrentAcCharge(valAc);
      setSuccess(`Settings updated successfully.`);
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
        <span className="panel__title">⚙️ System Settings</span>
        {!loading && currentGst !== null && (
          <span className="badge badge-muted">GST: {currentGst}% | AC: ₹{currentAcCharge}</span>
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
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="gst-pct">
                GST Percentage <span>*</span>
              </label>
              <input
                id="gst-pct"
                className="form-input"
                type="number"
                min={0} max={100} step={0.5}
                placeholder={loading ? 'Loading…' : 'e.g. 18'}
                value={inputGst}
                onChange={(e) => setInputGst(e.target.value)}
                disabled={loading}
                style={{ maxWidth: 200 }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="ac-charge">
                AC Extra Charge (Per Person) <span>*</span>
              </label>
              <input
                id="ac-charge"
                className="form-input"
                type="number"
                min={0} step={1}
                placeholder={loading ? 'Loading…' : 'e.g. 50'}
                value={inputAcCharge}
                onChange={(e) => setInputAcCharge(e.target.value)}
                disabled={loading}
                style={{ maxWidth: 200 }}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving || loading}
          >
            {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Settings'}
          </button>
        </form>

        <p className="text-dim" style={{ marginTop: '.75rem' }}>
          These settings take effect immediately for all new completions.
          AC charge is only applied to tables in an AC zone.
        </p>
      </div>
    </div>
  );
}
