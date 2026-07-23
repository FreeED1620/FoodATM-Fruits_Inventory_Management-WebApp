import React, { useState } from 'react';
import { ShiftProvider, useShift } from './context/ShiftContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { ShiftPicker } from './components/ShiftPicker';
import { Header } from './components/common/Header';
import { InventoryList } from './components/inventory/InventoryList';
import { HistoryPage } from './components/inventory/HistoryPage';
import { AddFruitModal } from './components/inventory/AddFruitModal';
import { ActionModal } from './components/inventory/ActionModal';
import { Toast } from './components/common/Toast';
import { Plus } from 'lucide-react';

type PageView = 'inventory' | 'history';

const AppContent: React.FC = () => {
  const { openAddModal } = useInventory();
  const [page, setPage] = useState<PageView>('inventory');

  return (
    <div className="app-container">
      <Header onNavigate={setPage} currentPage={page} />

      <main className="main-content">
        {page === 'inventory' && <InventoryList />}
        {page === 'history' && <HistoryPage onBack={() => setPage('inventory')} />}
      </main>

      {page === 'inventory' && (
        <button
          className="fab-add-btn"
          onClick={openAddModal}
          aria-label="Add Fruit Item"
          title="Add New Fruit Record"
          type="button"
        >
          <Plus size={28} />
        </button>
      )}

      <AddFruitModal />
      <ActionModal />
      <Toast />
    </div>
  );
};

const ShiftGate: React.FC = () => {
  const { currentShift } = useShift();

  if (currentShift === null) {
    return <ShiftPicker />;
  }

  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
};

export function App() {
  return (
    <ShiftProvider>
      <ShiftGate />
    </ShiftProvider>
  );
}

export default App;
