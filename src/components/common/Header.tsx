import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Plus, X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useShift } from '../../context/ShiftContext';
import { useTheme } from '../../context/ThemeContext';
import { PageView } from '../../App';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
  onNavigate: (page: PageView) => void;
  currentPage: PageView;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const { openAddModal } = useInventory();
  const { currentShift, endShift } = useShift();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
      document.documentElement.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleEndShift = () => {
    closeMenu();
    setShowEndConfirm(true);
  };

  const confirmEndShift = () => {
    setShowEndConfirm(false);
    endShift();
  };

  const handleNavigate = (page: PageView) => {
    closeMenu();
    onNavigate(page);
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  return (
    <header className="header-bar">
      <div className="header-content">
        <div className="brand-section">
          <div className="brand-icon-wrapper" title="FoodATM Warehouse">
            🍏
          </div>
          <div className="brand-title-group">
            <h1>FoodATM</h1>
            <p>Fruit Warehouse Inventory</p>
          </div>
        </div>

        <div className="header-actions">
          {currentShift !== null && (
            <span className="shift-badge">Shift {currentShift}</span>
          )}

          <button
            className="btn btn-primary header-desktop-add"
            onClick={openAddModal}
            type="button"
          >
            <Plus size={20} />
            <span>Add Fruit</span>
          </button>
          
          <button
            className="header-menu-btn"
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={24} color="#ffffff" strokeWidth={3} />
          </button>
        </div>
      </div>

      {createPortal(
        <>
          {menuOpen && (
            <div className="hamburger-overlay" />
          )}

          <div className={`hamburger-panel ${menuOpen ? 'open' : ''}`}>
            <div className="hamburger-panel-header">
              <h2>Menu</h2>
              <button
                className="hamburger-close-btn"
                type="button"
                onClick={closeMenu}
              >
                <X size={22} />
              </button>
            </div>

            <div className="hamburger-panel-body">
              {currentShift !== null && (
                <div className="hamburger-shift-info">
                  Active Shift: <strong>Shift {currentShift}</strong>
                </div>
              )}

              <button
                className={`hamburger-menu-item ${currentPage === 'inventory' ? 'active' : ''}`}
                onClick={() => handleNavigate('inventory')}
                type="button"
              >
                📦 Inventory
              </button>

              <button
                className={`hamburger-menu-item ${currentPage === 'history' ? 'active' : ''}`}
                onClick={() => handleNavigate('history')}
                type="button"
              >
                📋 Transaction History
              </button>

              <button
                className="hamburger-menu-item"
                onClick={handleToggleTheme}
                type="button"
              >
                {theme === 'light' ? (
                  <>🌙 Dark Theme</>
                ) : (
                  <>☀️ Light Theme</>
                )}
              </button>

              <button
                className="hamburger-menu-item danger"
                onClick={handleEndShift}
                type="button"
              >
                End Shift
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {createPortal(
        <ConfirmModal
          isOpen={showEndConfirm}
          onClose={() => setShowEndConfirm(false)}
          onConfirm={confirmEndShift}
          title="End Shift?"
          message="Are you sure you want to end this shift?"
        />,
        document.body
      )}
    </header>
  );
};
