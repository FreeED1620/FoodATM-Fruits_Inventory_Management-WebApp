import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Header } from '../common/Header';
import { InventoryList } from '../inventory/InventoryList';
import { HistoryPage } from '../inventory/HistoryPage';
import { ExpiredItemsPage } from '../inventory/ExpiredItemsPage';
import { AddFruitModal } from '../inventory/AddFruitModal';
import { ActionModal } from '../inventory/ActionModal';
import { Toast } from '../common/Toast';
import { Plus, RefreshCw } from 'lucide-react';
import type { PageView } from '../../App';

export const AdminUserView: React.FC = () => {
  const { openAddModal, refreshItems, fetchLogs } = useInventory();
  const [page, setPage] = useState<PageView>('inventory');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshItems(), fetchLogs()]);
    setRefreshing(false);
  };

  return (
    <div className="admin-page admin-user-view">
      <div className="admin-page-header-row">
        <div>
          <h1 className="admin-page-title">User View</h1>
          <p className="admin-page-desc">
            Full access — all actions, undo, and expire available.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
          type="button"
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="app-container" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
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
            aria-label="Add Item"
            title="Add New Item Record"
            type="button"
          >
            <Plus size={28} />
          </button>
        )}

        <AddFruitModal />
        <ActionModal />
        <Toast />
      </div>
    </div>
  );
};
