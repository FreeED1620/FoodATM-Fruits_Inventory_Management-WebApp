import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { ThemeProvider } from './context/ThemeContext';
import { SessionPicker } from './components/SessionPicker';
import { Header } from './components/common/Header';
import { InventoryList } from './components/inventory/InventoryList';
import { HistoryPage } from './components/inventory/HistoryPage';
import { ExpiredItemsPage } from './components/inventory/ExpiredItemsPage';
import { AddFruitModal } from './components/inventory/AddFruitModal';
import { ActionModal } from './components/inventory/ActionModal';
import { Toast } from './components/common/Toast';
import { AdminGate } from './components/admin/AdminGate';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminInventory } from './components/admin/AdminInventory';
import { AdminFruitImages } from './components/admin/AdminFruitImages';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminSessions } from './components/admin/AdminSessions';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminUserSummary } from './components/admin/AdminUserSummary';
import { Plus } from 'lucide-react';

export type PageView = 'inventory' | 'history' | 'expired';

const InventoryApp: React.FC = () => {
  const { openAddModal } = useInventory();
  const [page, setPage] = useState<PageView>('inventory');

  return (
    <div className="app-container">
      <Header onNavigate={setPage} currentPage={page} />

      <main className="main-content">
        {page === 'inventory' && <InventoryList onNavigate={setPage} />}
        {page === 'history' && <HistoryPage onBack={() => setPage('inventory')} />}
        {page === 'expired' && <ExpiredItemsPage onBack={() => setPage('inventory')} />}
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

const InventoryGate: React.FC = () => {
  const { currentSession } = useSession();

  if (currentSession?.userName === 'Admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!currentSession) {
    return <SessionPicker />;
  }

  return (
    <InventoryProvider>
      <InventoryApp />
    </InventoryProvider>
  );
};

const AdminRoute: React.FC = () => {
  const { currentSession } = useSession();
  const isAdminAuth = localStorage.getItem('foodatm_admin_auth') === 'true';

  if (!currentSession || currentSession.userName !== 'Admin' || !isAdminAuth) {
    return <Navigate to="/" replace />;
  }

  return (
    <InventoryProvider>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminOverview />} />
          <Route path="/user-summary" element={<AdminUserSummary />} />
          <Route path="/inventory" element={<AdminInventory />} />
          <Route path="/fruit-images" element={<AdminFruitImages />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/sessions" element={<AdminSessions />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </InventoryProvider>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminGate>
            <AdminRoute />
          </AdminGate>} />
          <Route path="*" element={<InventoryGate />} />
        </Routes>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
