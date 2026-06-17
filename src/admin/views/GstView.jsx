// frontend/src/admin/views/GstView.jsx
// Standalone GST configuration page.
import GstSettingsForm from '../components/GstSettingsForm.jsx';

export default function GstView() {
  return (
    <div className="view-animate" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <div className="page-header__breadcrumb">Admin › System Settings</div>
          <div className="page-header__title">⚙️ System Configuration</div>
        </div>
      </div>
      <div className="page-body" style={{ flex: 1, overflowY: 'auto', maxWidth: 640 }}>
        <p className="text-dim" style={{ marginBottom: '1.5rem', lineHeight: 1.7 }}>
          Configure the global system settings such as GST percentage and AC Seating Charge.
        </p>
        <GstSettingsForm />
      </div>
    </div>
  );
}
