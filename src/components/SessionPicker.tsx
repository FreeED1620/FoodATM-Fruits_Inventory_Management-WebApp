import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { LogIn, Shield } from 'lucide-react';

const USERS = ['User-1', 'User-2', 'User-3', 'User-4'];

export const SessionPicker: React.FC = () => {
  const { startSession } = useSession();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleStart = async () => {
    if (!selectedUser) {
      setError('Please select a user.');
      return;
    }

    setStarting(true);
    setError(null);
    try {
      await startSession(selectedUser);
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      setStarting(false);
    }
  };

  const handleAdminClick = () => {
    setSelectedUser('Admin');
    setError(null);
    setShowAdminPassword(true);
    setAdminPassword('');
    setAdminError(null);
  };

  const handleAdminLogin = async () => {
    const storedPassword = localStorage.getItem('foodatm_admin_password') || 'admin123';
    if (adminPassword !== storedPassword) {
      setAdminError('Incorrect password');
      return;
    }

    setAdminLoading(true);
    setAdminError(null);
    try {
      await startSession('Admin');
      localStorage.setItem('foodatm_admin_auth', 'true');
      navigate('/admin');
    } catch (err: any) {
      setAdminError(err.message || 'Failed to start admin session');
      setAdminLoading(false);
    }
  };

  return (
    <div className="shift-picker-screen">
      <div className="shift-picker-content">
        <div className="shift-picker-icon">🍏</div>
        <h1 className="shift-picker-title">FoodATM</h1>
        <p className="shift-picker-subtitle">Select your name to begin</p>

        <div className="session-user-grid">
          {USERS.map(user => (
            <button
              key={user}
              className={`session-user-btn ${selectedUser === user ? 'selected' : ''}`}
              onClick={() => { setSelectedUser(user); setError(null); setShowAdminPassword(false); }}
              type="button"
            >
              <span className="session-user-avatar">
                {user.charAt(0).toUpperCase()}
              </span>
              <span className="session-user-name">{user}</span>
            </button>
          ))}

          <button
            className={`session-user-btn session-user-btn-admin ${selectedUser === 'Admin' ? 'selected' : ''}`}
            onClick={handleAdminClick}
            type="button"
          >
            <span className="session-user-avatar admin-avatar">
              <Shield size={22} />
            </span>
            <span className="session-user-name">Admin</span>
          </button>
        </div>

        {showAdminPassword && (
          <div className="admin-password-form">
            <p className="admin-password-label">Enter admin password</p>
            <input
              type="password"
              className="form-input"
              placeholder="Password"
              value={adminPassword}
              onChange={e => { setAdminPassword(e.target.value); setAdminError(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleAdminLogin(); }}
              autoFocus
            />
            {adminError && (
              <div className="form-error" style={{ marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                {adminError}
              </div>
            )}
            <button
              className="btn btn-primary session-start-btn"
              onClick={handleAdminLogin}
              disabled={adminLoading}
              type="button"
              style={{ marginTop: '0.75rem' }}
            >
              <Shield size={18} />
              <span>{adminLoading ? 'Verifying...' : 'Login as Admin'}</span>
            </button>
          </div>
        )}

        {error && (
          <div className="form-error" style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.65rem 0.85rem', borderRadius: '8px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!showAdminPassword && (
          <button
            className="btn btn-primary session-start-btn"
            onClick={handleStart}
            disabled={!selectedUser || starting}
            type="button"
          >
            <LogIn size={20} />
            <span>{starting ? 'Starting...' : 'Start Session'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
