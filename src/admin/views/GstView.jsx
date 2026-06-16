// frontend/src/admin/views/GstView.jsx
// Standalone GST configuration page.
import GstSettingsForm from '../components/GstSettingsForm.jsx';

export default function GstView() {
  return (
    <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <div className="page-header__breadcrumb">Admin › Finance › GST Settings</div>
          <div className="page-header__title">⚙️ GST Configuration</div>
        </div>
      </div>
      <div className="page-body" style={{ flex: 1, overflowY: 'auto', maxWidth: 640 }}>
        <p className="text-dim" style={{ marginBottom: '1.5rem', lineHeight: 1.7 }}>
          Configure the GST percentage applied when a waiter completes an order.
          The updated rate takes effect immediately for all new completions.
        </p>
        <GstSettingsForm />
      </div>
    </div>
  );
}
