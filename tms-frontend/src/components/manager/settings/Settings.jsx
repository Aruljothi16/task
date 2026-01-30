import React from 'react';
import ProfileSettings from '../../shared/ProfileSettings';
import ChangePassword from '../../shared/ChangePassword';

const Settings = () => {
  return (
    <div className="content">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Manager Account</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Update your manager profile and security settings.</p>
      </div>

      <div className="settings-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
        <div className="settings-main">
          <ProfileSettings />
        </div>
        <div className="settings-sidebar">
          <ChangePassword />


        </div>
      </div>
    </div>
  );
};

export default Settings;






