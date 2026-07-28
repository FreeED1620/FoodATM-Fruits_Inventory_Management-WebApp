import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { isSupabaseConfigured, supabase } from '../../services/supabaseClient';
import { getDaysUntil } from '../../utils/dateUtils';
import { Package, AlertTriangle, Clock, Layers } from 'lucide-react';

interface SessionInfo {
  id: string;
  user_name: string;
  started_at: string;
  ended_at: string | null;
}

export const AdminOverview: React.FC = () => {
  const { stats, items } = useInventory();
  const [sessionCount, setSessionCount] = useState(0);
  const [recentSessions, setRecentSessions] = useState<SessionInfo[]>([]);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!isSupabaseConfigured || !supabase) return;

      const [activeSnap, recentSnap] = await Promise.all([
        supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .is('ended_at', null)
          .neq('user_name', 'Admin'),
        supabase
          .from('sessions')
          .select('*')
          .neq('user_name', 'Admin')
          .order('started_at', { ascending: false })
          .limit(4),
      ]);

      setSessionCount(activeSnap.count ?? 0);
      if (recentSnap.data) setRecentSessions(recentSnap.data);
    };

    fetchSessionData();
  }, []);

  const criticalItems = items.filter(i => i.quantity > 0 && getDaysUntil(i.expiryDate) >= 0 && getDaysUntil(i.expiryDate) <= 3);

  const statCards = [
    { label: 'Total Items', value: stats.totalItems, icon: Package, color: '#3b82f6' },
    { label: 'Total Quantity', value: stats.totalQuantityKg, icon: Layers, color: '#8b5cf6' },
    { label: 'Expiring Soon', value: stats.expiringSoonCount, icon: AlertTriangle, color: '#f59e0b' },
    { label: 'Active Sessions', value: sessionCount, icon: Clock, color: '#10b981' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Inventory Overview</h1>

      <div className="admin-stats-grid">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: card.color + '20', color: card.color }}>
                <Icon size={22} />
              </div>
              <div className="admin-stat-info">
                <span className="admin-stat-value">{card.value}</span>
                <span className="admin-stat-label">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Critical Items (Expiring within 3 days)</h2>
        {criticalItems.length === 0 ? (
          <p className="admin-empty-text">No critical items</p>
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
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {criticalItems.map(item => (
                  <tr key={item.id}>
                    <td className="admin-table-id">{item.inventoryId}</td>
                    <td>{item.fruitName}</td>
                    <td>{item.quantity}</td>
                    <td>B{item.batchNumber}</td>
                    <td>{item.receivedDate}</td>
                    <td>{item.expiryDate}</td>
                    <td className="admin-text-critical">{getDaysUntil(item.expiryDate)}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h2 className="admin-section-title">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <p className="admin-empty-text">No sessions yet</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Started</th>
                  <th>Ended</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map(s => (
                  <tr key={s.id}>
                    <td>{s.user_name}</td>
                    <td>{new Date(s.started_at).toLocaleString()}</td>
                    <td>{s.ended_at ? new Date(s.ended_at).toLocaleString() : '—'}</td>
                    <td>
                      <span className={`admin-badge ${s.ended_at ? 'badge-ended' : 'badge-active'}`}>
                        {s.ended_at ? 'Ended' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
