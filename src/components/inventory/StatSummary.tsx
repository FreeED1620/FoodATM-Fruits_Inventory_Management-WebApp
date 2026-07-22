import React from 'react';
import { Package, Box, AlertTriangle, Layers } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const StatSummary: React.FC = () => {
  const { stats } = useInventory();

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#e11d48', background: '#ffe4e6' }}>
          <Package size={20} />
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.totalItems}</div>
          <div className="stat-label">Total Records</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#059669', background: '#dcfce7' }}>
          <Box size={20} />
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.totalQuantityKg} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>boxes</span></div>
          <div className="stat-label">Total Boxes</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#9f1239', background: '#ffe4e6' }}>
          <AlertTriangle size={20} />
        </div>
        <div className="stat-info">
          <div className="stat-value" style={{ color: stats.expiringSoonCount > 0 ? '#e11d48' : 'inherit' }}>
            {stats.expiringSoonCount}
          </div>
          <div className="stat-label">Expiring Soon (≤3d)</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#d97706', background: '#fef3c7' }}>
          <Layers size={20} />
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.activeBatchesCount}</div>
          <div className="stat-label">Active Batches</div>
        </div>
      </div>
    </div>
  );
};
