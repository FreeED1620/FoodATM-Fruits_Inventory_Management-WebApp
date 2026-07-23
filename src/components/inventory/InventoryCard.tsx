import React from 'react';
import { Calendar, Play } from 'lucide-react';
import { InventoryItem } from '../../types/inventory';
import { formatDate, getExpiryStatus } from '../../utils/dateUtils';
import { FruitImage } from '../common/FruitImage';
import { useInventory } from '../../context/InventoryContext';

interface InventoryCardProps {
  item: InventoryItem;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ item }) => {
  const { openActionModal } = useInventory();
  const expiryInfo = getExpiryStatus(item.expiryDate);

  const getCardThemeClass = () => {
    switch (expiryInfo.urgency) {
      case 'EXPIRED':
      case 'CRITICAL':
        return 'card-theme-critical';
      case 'WARNING':
        return 'card-theme-warning';
      case 'FRESH':
      default:
        return 'card-theme-fresh';
    }
  };

  return (
    <div className={`inventory-card ${getCardThemeClass()}`}>
      {/* Top Header Row */}
      <div className="card-top-row">
        <div className="card-fruit-info-group">
          {/* White Box with Fruit Image */}
          <div className="card-emoji-box">
            <FruitImage fruitName={item.fruitName} size={36} />
          </div>

          {/* White Box with Fruit Name & Batch Pill */}
          <div className="card-title-box">
            <div className="card-fruit-name">{item.fruitName}</div>
            <div className="pill-batch">Batch {item.batchNumber}</div>
          </div>
        </div>

        {/* Expiry Badge */}
        <div className="card-expiry-badge">
          {expiryInfo.label}
        </div>
      </div>

      {/* Bottom Details & Action Button Row */}
      <div className="card-bottom-row">
        {/* White Details Box */}
        <div className="card-details-box">
          <div className="detail-col">
            <div className="detail-label">QUANTITY</div>
            <div className="detail-val-quantity">{item.quantity} {item.unit}</div>
          </div>

          <div className="detail-col">
            <div className="detail-label">RECEIVED DATE</div>
            <div className="detail-val-date">
              <Calendar size={13} className="date-icon" />
              <span>{formatDate(item.receivedDate)}</span>
            </div>
          </div>
        </div>

        {/* Big Green Process Action Button */}
        <button
          className="card-process-btn"
          onClick={() => openActionModal(item)}
          type="button"
          aria-label={`Process ${item.fruitName}`}
        >
          <span>Process</span>
          <div className="play-icon-circle">
            <Play size={11} fill="currentColor" style={{ marginLeft: '1px' }} />
          </div>
        </button>
      </div>
    </div>
  );
};
