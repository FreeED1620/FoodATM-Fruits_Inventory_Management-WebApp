import React from 'react';
import { Plus } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const Header: React.FC = () => {
  const { openAddModal } = useInventory();

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
          <button
            className="btn btn-primary"
            onClick={openAddModal}
            type="button"
          >
            <Plus size={20} />
            <span>Add Fruit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
