import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryCard } from './InventoryCard';
import { StatSummary } from './StatSummary';

export const InventoryList: React.FC = () => {
  const {
    filteredItems,
    items,
    loading,
    searchQuery,
    setSearchQuery,
    activeBatchFilter,
    setActiveBatchFilter,
    activeExpiryFilter,
    setActiveExpiryFilter,
    openAddModal,
  } = useInventory();

  // Extract unique active batch numbers from all items
  const uniqueBatches = Array.from(new Set(items.map(i => i.batchNumber))).sort((a, b) => a - b);

  if (loading && items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading fruit inventory...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Metric Summary */}
      <StatSummary />

      {/* Filter and Search Bar */}
      <div className="filter-container">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search fruit name, ID (e.g. B01-F001), or Batch..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            maxLength={50}
          />
        </div>

        {/* Filter Chips */}
        <div className="filter-chips">
          <button
            className={`chip-btn ${activeExpiryFilter === 'ALL' && activeBatchFilter === null ? 'active' : ''}`}
            onClick={() => {
              setActiveExpiryFilter('ALL');
              setActiveBatchFilter(null);
            }}
            type="button"
          >
            All Items
          </button>

          <button
            className={`chip-btn ${activeExpiryFilter === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setActiveExpiryFilter(activeExpiryFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            type="button"
            style={activeExpiryFilter === 'CRITICAL' ? { background: '#ef4444', borderColor: '#ef4444' } : {}}
          >
            ⚠️ Expiring Soon
          </button>

          <button
            className={`chip-btn ${activeExpiryFilter === 'FRESH' ? 'active' : ''}`}
            onClick={() => setActiveExpiryFilter(activeExpiryFilter === 'FRESH' ? 'ALL' : 'FRESH')}
            type="button"
          >
            🟢 Fresh
          </button>

          {uniqueBatches.map(batchNum => (
            <button
              key={`batch-chip-${batchNum}`}
              className={`chip-btn ${activeBatchFilter === batchNum ? 'active' : ''}`}
              onClick={() => setActiveBatchFilter(activeBatchFilter === batchNum ? null : batchNum)}
              type="button"
            >
              Batch {batchNum}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List or Empty State */}
      {filteredItems.length > 0 ? (
        <div className="inventory-grid">
          {filteredItems.map(item => (
            <InventoryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🧺</div>
          <h3 className="empty-title">No Fruit Records Found</h3>
          <p className="empty-desc">
            {searchQuery || activeBatchFilter !== null || activeExpiryFilter !== 'ALL'
              ? 'No fruit items match your current search or filter criteria.'
              : 'The fruit warehouse inventory is currently empty. Tap the button below to register a fruit entry.'}
          </p>
          <button className="btn btn-primary" onClick={openAddModal} type="button">
            <Plus size={18} />
            <span>Add First Fruit Record</span>
          </button>
        </div>
      )}
    </div>
  );
};
