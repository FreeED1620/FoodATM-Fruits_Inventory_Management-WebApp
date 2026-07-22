import React from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/common/Header';
import { InventoryList } from './components/inventory/InventoryList';
import { AddFruitModal } from './components/inventory/AddFruitModal';
import { ActionModal } from './components/inventory/ActionModal';
import { Toast } from './components/common/Toast';
import { Plus } from 'lucide-react';

const AppContent: React.FC = () => {
  const { openAddModal } = useInventory();

  return (
    <div className="app-container">
      {/* Top sticky navbar header */}
      <Header />

      {/* Main Container */}
      <main className="main-content">
        <InventoryList />
      </main>

      {/* Mobile Floating (+) Add Button for touch users */}
      <button
        className="fab-add-btn"
        onClick={openAddModal}
        aria-label="Add Fruit Item"
        title="Add New Fruit Record"
        type="button"
      >
        <Plus size={28} />
      </button>

      {/* Modals & Toasts */}
      <AddFruitModal />
      <ActionModal />
      <Toast />
    </div>
  );
};

export function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}

export default App;
