import React, { useState } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const storedPassword = localStorage.getItem('foodatm_admin_password') || 'admin123';

  const handleChangePassword = () => {
    setMessage(null);

    if (currentPassword !== storedPassword) {
      setMessage({ type: 'error', text: 'Current password is incorrect' });
      return;
    }

    if (!newPassword.trim()) {
      setMessage({ type: 'error', text: 'New password cannot be empty' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    localStorage.setItem('foodatm_admin_password', newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: 'Password changed successfully!' });
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Settings</h1>

      <div className="admin-section">
        <h2 className="admin-section-title">Change Admin Password</h2>
        <p className="admin-page-desc" style={{ marginBottom: '1.25rem' }}>
          This password protects access to the admin dashboard.
        </p>

        <div className="admin-form-group">
          <label className="admin-label">Current Password</label>
          <div className="admin-password-field">
            <input
              type={showCurrent ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={e => { setCurrentPassword(e.target.value); setMessage(null); }}
            />
            <button className="admin-eye-btn" onClick={() => setShowCurrent(!showCurrent)} type="button">
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">New Password</label>
          <div className="admin-password-field">
            <input
              type={showNew ? 'text' : 'password'}
              className="form-input"
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setMessage(null); }}
            />
            <button className="admin-eye-btn" onClick={() => setShowNew(!showNew)} type="button">
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Confirm New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setMessage(null); }}
            onKeyDown={e => { if (e.key === 'Enter') handleChangePassword(); }}
          />
        </div>

        {message && (
          <div
            className="form-error"
            style={{
              marginTop: '0.75rem',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? '#22c55e' : undefined,
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            {message.text}
          </div>
        )}

        <button className="btn btn-primary" onClick={handleChangePassword} type="button" style={{ marginTop: '1rem' }}>
          <Save size={18} />
          <span>Save New Password</span>
        </button>
      </div>
    </div>
  );
};
