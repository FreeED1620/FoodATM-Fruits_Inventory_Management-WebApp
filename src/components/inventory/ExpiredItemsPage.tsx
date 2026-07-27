import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { FruitImage } from '../common/FruitImage';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatDate, getDaysUntil } from '../../utils/dateUtils';
import { InventoryItem } from '../../types/inventory';

interface ExpiredItemsPageProps {
  onBack: () => void;
}

export const ExpiredItemsPage: React.FC<ExpiredItemsPageProps> = ({ onBack }) => {
  const { items, loading, disposeItem } = useInventory();
  const [disposeTarget, setDisposeTarget] = useState<InventoryItem | null>(null);
  const [disposing, setDisposing] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatExpiredDuration = (dateStr: string): string => {
    void tick;
    const now = new Date();
    const marked = new Date(dateStr);
    const diffMs = now.getTime() - marked.getTime();
    if (diffMs <= 0) return 'just now';
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
    return `${parts.join(' ')} ago`;
  };

  const expiredItems = useMemo(() => {
    return items.filter(item => {
      if (item.status === 'DISPOSED') return false;
      if (item.status === 'EXPIRED') return true;
      if (item.quantity <= 0) return false;
      return getDaysUntil(item.expiryDate) < 0;
    });
  }, [items]);

  const handleDispose = async () => {
    if (!disposeTarget) return;
    setDisposing(true);
    await disposeItem(disposeTarget.id);
    setDisposing(false);
    setDisposeTarget(null);
  };

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
                    <span>{formatExpiredDuration(item.updatedAt || item.expiryDate)}</span>
                  </div>
                </div>
                <div className="expired-card-bottom">
                  <div className="expired-card-details-row">
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
                  <button
                    className="expired-dispose-btn"
                    onClick={() => setDisposeTarget(item)}
                    type="button"
                  >
                    <Trash2 size={14} />
                    <span>Dispose</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={disposeTarget !== null}
        onClose={() => setDisposeTarget(null)}
        onConfirm={handleDispose}
        title="Dispose Item?"
        message={`This will permanently dispose "${disposeTarget?.fruitName}" (${disposeTarget?.inventoryId}) from inventory and log it in transaction history.`}
        confirmText={disposing ? 'Processing...' : 'Confirm'}
        danger
      />
    </div>
  );
};
