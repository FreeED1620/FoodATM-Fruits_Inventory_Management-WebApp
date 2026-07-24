import React, { useMemo } from 'react';
import { ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { FruitImage } from '../common/FruitImage';
import { formatDate, getDaysUntil } from '../../utils/dateUtils';

interface ExpiredItemsPageProps {
  onBack: () => void;
}

export const ExpiredItemsPage: React.FC<ExpiredItemsPageProps> = ({ onBack }) => {
  const { items, loading } = useInventory();

  const expiredItems = useMemo(() => {
    return items.filter(item => {
      if (item.quantity <= 0) return false;
      return getDaysUntil(item.expiryDate) < 0;
    });
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <button className="history-back-btn" onClick={onBack} type="button">
          <ArrowLeft size={20} />
        </button>
        <h2 className="history-title">Expired Items</h2>
        {expiredItems.length > 0 && (
          <span className="expired-count-badge">{expiredItems.length}</span>
        )}
      </div>

      {expiredItems.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <div className="empty-icon">✅</div>
          <h3 className="empty-title">No Expired Items</h3>
          <p className="empty-desc">All items in the inventory are still fresh.</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {expiredItems.map(item => {
            const daysExpired = Math.abs(getDaysUntil(item.expiryDate));
            return (
              <div key={item.id} className="expired-item-card">
                <div className="expired-card-top">
                  <div className="expired-card-fruit">
                    <FruitImage fruitName={item.fruitName} size={40} />
                    <div className="expired-card-info">
                      <div className="expired-card-name">{item.fruitName}</div>
                      <div className="expired-card-id">{item.inventoryId}</div>
                    </div>
                  </div>
                  <div className="expired-days-badge">
                    <AlertTriangle size={12} />
                    <span>{daysExpired}d ago</span>
                  </div>
                </div>
                <div className="expired-card-bottom">
                  <div className="expired-detail">
                    <span className="expired-detail-label">Quantity</span>
                    <span className="expired-detail-value">{item.quantity} {item.unit}</span>
                  </div>
                  <div className="expired-detail">
                    <span className="expired-detail-label">Expiry</span>
                    <span className="expired-detail-value">
                      <Calendar size={12} />
                      {formatDate(item.expiryDate)}
                    </span>
                  </div>
                  <div className="expired-detail">
                    <span className="expired-detail-label">Batch</span>
                    <span className="expired-detail-value">Batch {item.batchNumber}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
