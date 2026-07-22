import React from 'react';
import { Clock, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { InventoryItem } from '../../types/inventory';
import { formatDate, getExpiryStatus } from '../../utils/dateUtils';
import { getFruitIcon } from '../../utils/formatters';
import { formatBatchPrefix } from '../../utils/idGenerator';
import { useInventory } from '../../context/InventoryContext';

interface InventoryCardProps {
  item: InventoryItem;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const { openActionModal } = useInventory();
  const expiryInfo = getExpiryStatus(item.expiryDate);
  const fruitIcon = getFruitIcon(item.fruitName);
  const batchLabel = formatBatchPrefix(item.batchNumber);

  const getBadgeClass = () => {
    switch (expiryInfo.urgency) {
      case 'EXPIRED':
      case 'CRITICAL':
        return 'expiry-critical';
      case 'WARNING':
        return 'expiry-warning';
      case 'FRESH':
      default:
        return 'expiry-fresh';
    }
  };

  return (
    <div className="inventory-card" onClick={() => openActionModal(item)}>
      {/* Header Row */}
      <div className="card-header-row">
        <div className="card-title-group">
          <div className="card-fruit-emoji">{fruitIcon}</div>
          <div>
            <div className="card-fruit-name">{item.fruitName}</div>
            <div className="pill-group">
              <span className="pill pill-batch">Batch {item.batchNumber} ({batchLabel})</span>
              <span className="pill pill-id">{item.inventoryId}</span>
            </div>
          </div>
        </div>

        {/* Expiry Badge */}
        <div className={`expiry-badge ${getBadgeClass()}`}>
          {expiryInfo.urgency === 'CRITICAL' && <AlertCircle size={13} />}
          <span>{expiryInfo.label}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="card-details-grid">
        <div className="detail-item">
          <div className="detail-label">Quantity</div>
          <div className="detail-value" style={{ color: '#10b981' }}>
            {item.quantity} {item.unit}
          </div>
        </div>

        <div className="detail-item">
          <div className="detail-label">Received Date</div>
          <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={13} color="#9ca3af" />
            <span>{formatDate(item.receivedDate)}</span>
          </div>
        </div>

        <div className="detail-item" style={{ gridColumn: 'span 2' }}>
          <div className="detail-label">Expiry Date</div>
          <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: expiryInfo.urgency === 'CRITICAL' ? '#fca5a5' : 'inherit' }}>
            <Clock size={13} color={expiryInfo.urgency === 'CRITICAL' ? '#fca5a5' : '#9ca3af'} />
            <span>{formatDate(item.expiryDate)}</span>
          </div>
        </div>
      </div>

      {/* Action Touch Hint */}
      <div className="card-action-hint">
        <span>Tap for Actions (Sell/Distribute/Transfer)</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
};
