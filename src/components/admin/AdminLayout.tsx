import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Users, ClipboardList, Settings, Package, Image, LogOut, Menu, X, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/user-summary', label: 'User Activity', icon: Activity },
  { path: '/admin/inventory', label: 'Inventory Items', icon: Package },
  { path: '/admin/fruit-images', label: 'Manage Fruits', icon: Image },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/sessions', label: 'Sessions', icon: ClipboardList },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { endSession } = useSession();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    localStorage.removeItem('foodatm_admin_auth');
    await endSession();
    navigate('/');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      {/* Mobile top bar */}
      <div className="admin-mobile-header">
        <button className="admin-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} type="button">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="admin-mobile-title">Admin Dashboard</h2>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo">🍏</span>
          <span className="admin-sidebar-brand">Admin Panel</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={toggleTheme} type="button">
            {theme === 'light' ? '🌙' : '☀️'}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <button className="admin-nav-item danger" onClick={handleLogout} type="button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};
