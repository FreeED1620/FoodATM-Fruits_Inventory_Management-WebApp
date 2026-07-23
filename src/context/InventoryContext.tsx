import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ActionInput, AddFruitInput, InventoryItem, InventoryLog, InventoryStats } from '../types/inventory';
import { InventoryService } from '../services/inventoryService';
import { getDaysUntil, sortByNearestExpiry } from '../utils/dateUtils';
import { useShift } from './ShiftContext';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface InventoryContextType {
  items: InventoryItem[];
  filteredItems: InventoryItem[];
  logs: InventoryLog[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  activeBatchFilter: number | null;
  activeExpiryFilter: 'ALL' | 'CRITICAL' | 'WARNING' | 'FRESH' | 'EXPIRED';
  isAddModalOpen: boolean;
  isActionModalOpen: boolean;
  selectedItemForAction: InventoryItem | null;
  toast: ToastState | null;
  stats: InventoryStats;
  
  // Actions
  refreshItems: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  undoAction: (logId: string) => Promise<boolean>;
  addFruit: (input: AddFruitInput) => Promise<boolean>;
  recordItemAction: (input: ActionInput) => Promise<boolean>;
  setSearchQuery: (query: string) => void;
  setActiveBatchFilter: (batch: number | null) => void;
  setActiveExpiryFilter: (filter: 'ALL' | 'CRITICAL' | 'WARNING' | 'FRESH' | 'EXPIRED') => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  openActionModal: (item: InventoryItem) => void;
  closeActionModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentShift } = useShift();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBatchFilter, setActiveBatchFilter] = useState<number | null>(null);
  const [activeExpiryFilter, setActiveExpiryFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'FRESH' | 'EXPIRED'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<InventoryItem | null>(null);

  // Toast Notifications
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      id: Date.now().toString(),
      message,
      type,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const refreshItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedItems = await InventoryService.getItems();
      setItems(sortByNearestExpiry(fetchedItems));
    } catch (err: any) {
      console.error(err);
      setError('Failed to load inventory items.');
      showToast('Error loading inventory data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchLogs = useCallback(async () => {
    try {
      const fetchedLogs = await InventoryService.getLogs();
      setLogs(fetchedLogs);
    } catch (err: any) {
      console.error(err);
      showToast('Error loading transaction history', 'error');
    }
  }, [showToast]);

  const undoAction = useCallback(async (logId: string): Promise<boolean> => {
    try {
      await InventoryService.undoAction(logId);
      await refreshItems();
      await fetchLogs();
      showToast('Action undone successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to undo action', 'error');
      return false;
    }
  }, [refreshItems, fetchLogs, showToast]);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  const addFruit = async (input: AddFruitInput): Promise<boolean> => {
    if (currentShift === null) {
      showToast('No active shift. Please select a shift first.', 'error');
      return false;
    }
    try {
      const createdItem = await InventoryService.addFruit(input, currentShift);
      setItems(prev => sortByNearestExpiry([createdItem, ...prev]));
      showToast(`Added ${createdItem.fruitName} (${createdItem.inventoryId}) successfully!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to add fruit record', 'error');
      return false;
    }
  };

  const recordItemAction = async (input: ActionInput): Promise<boolean> => {
    if (currentShift === null) {
      showToast('No active shift. Please select a shift first.', 'error');
      return false;
    }
    try {
      const { updatedItem } = await InventoryService.recordAction(input, currentShift);
      setItems(prev => sortByNearestExpiry(prev.map(i => i.id === updatedItem.id ? updatedItem : i)));
      showToast(`Action recorded for ${updatedItem.inventoryId} (${input.action})`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Failed to process inventory action', 'error');
      return false;
    }
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openActionModal = (item: InventoryItem) => {
    setSelectedItemForAction(item);
    setIsActionModalOpen(true);
  };
  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedItemForAction(null);
  };

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Exclude zero-quantity or non-available items unless specified
      if (item.quantity <= 0) return false;

      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        item.fruitName.toLowerCase().includes(query) ||
        item.inventoryId.toLowerCase().includes(query) ||
        `batch ${item.batchNumber}`.includes(query) ||
        `b${item.batchNumber}`.includes(query);

      if (!matchesSearch) return false;

      // Batch filter match
      if (activeBatchFilter !== null && item.batchNumber !== activeBatchFilter) {
        return false;
      }

      // Expiry Filter match
      if (activeExpiryFilter !== 'ALL') {
        const days = getDaysUntil(item.expiryDate);
        if (activeExpiryFilter === 'EXPIRED' && days >= 0) return false;
        if (activeExpiryFilter === 'CRITICAL' && (days < 0 || days > 3)) return false;
        if (activeExpiryFilter === 'WARNING' && (days <= 3 || days > 7)) return false;
        if (activeExpiryFilter === 'FRESH' && days <= 7) return false;
      }

      return true;
    });
  }, [items, searchQuery, activeBatchFilter, activeExpiryFilter]);

  // Overall Statistics computation
  const stats: InventoryStats = useMemo(() => {
    const activeItems = items.filter(i => i.quantity > 0);
    const batchSet = new Set(activeItems.map(i => i.batchNumber));
    let totalKg = 0;
    let expiringSoon = 0;
    let expired = 0;

    activeItems.forEach(item => {
      totalKg += item.quantity;
      const days = getDaysUntil(item.expiryDate);
      if (days < 0) expired++;
      else if (days <= 3) expiringSoon++;
    });

    return {
      totalItems: activeItems.length,
      totalQuantityKg: totalKg,
      expiringSoonCount: expiringSoon,
      expiredCount: expired,
      activeBatchesCount: batchSet.size,
    };
  }, [items]);

  return (
    <InventoryContext.Provider
      value={{
        items,
        filteredItems,
        logs,
        loading,
        error,
        searchQuery,
        activeBatchFilter,
        activeExpiryFilter,
        isAddModalOpen,
        isActionModalOpen,
        selectedItemForAction,
        toast,
        stats,
        refreshItems,
        fetchLogs,
        undoAction,
        addFruit,
        recordItemAction,
        setSearchQuery,
        setActiveBatchFilter,
        setActiveExpiryFilter,
        openAddModal,
        closeAddModal,
        openActionModal,
        closeActionModal,
        showToast,
        hideToast,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
