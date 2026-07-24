import React from 'react';
import { useSession } from '../../context/SessionContext';

export const AdminGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentSession } = useSession();
  const isAdminAuth = localStorage.getItem('foodatm_admin_auth') === 'true';

  if (!currentSession || currentSession.userName !== 'Admin' || !isAdminAuth) {
    return (
      <div className="shift-picker-screen">
        <div className="shift-picker-content">
          <div className="shift-picker-icon">🔒</div>
          <h1 className="shift-picker-title">Access Denied</h1>
          <p className="shift-picker-subtitle">
            You need to log in as Admin from the session picker.
          </p>
          <a href="/" className="btn btn-primary session-start-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
