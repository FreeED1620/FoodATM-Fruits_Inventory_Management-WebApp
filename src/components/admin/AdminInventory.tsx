import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Search, RefreshCw } from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const { items, refreshItems } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'EXPIRED' | 'DISPOSED' | 'SOLD' | 'DISTRIBUTED' | 'TRANSFERRED'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshItems();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    return items
      .filter(item => {
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

        const q = searchQuery.toLowerCase().trim();
        if (q && !item.fruitName.toLowerCase().includes(q) && !item.inventoryId.toLowerCase().includes(q)) return false;

        return true;
      })
      .sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt;
        const bTime = b.updatedAt || b.createdAt;
        return bTime.localeCompare(aTime);
      });
  }, [items, searchQuery, statusFilter]);

  const statusOptions: Array<{ value: typeof statusFilter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'SOLD', label: 'Sold' },
    { value: 'DISTRIBUTED', label: 'Distributed' },
    { value: 'TRANSFERRED', label: 'Transferred' },
    { value: 'DISPOSED', label: 'Disposed' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Inventory Items</h1>
      <p className="admin-page-desc">All inventory records in the system.</p>

      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="uab-refresh-btn" onClick={handleRefresh} disabled={refreshing} type="button">
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
        <div className="admin-status-chips">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              className={`admin-chip ${statusFilter === opt.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className="admin-result-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <p className="admin-empty-text">No items match your filters.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fruit</th>
                <th>Qty</th>
                <th>Batch</th>
                <th>Received</th>
                <th>Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                  <tr key={item.id}>
                    <td className="admin-table-id">{item.inventoryId}</td>
                    <td>{item.fruitName}</td>
                    <td>{item.quantity}</td>
                    <td>B{item.batchNumber}</td>
                    <td>{item.receivedDate}</td>
                    <td>{item.expiryDate}</td>
                    <td>
                      <span className={`admin-badge badge-${item.status === 'AVAILABLE' ? 'active' : 'ended'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
