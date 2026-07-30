import React, { useState, useEffect, useMemo } from 'react';
import { InventoryService } from '../../services/inventoryService';
import { InventoryLog } from '../../types/inventory';
import { FruitImage } from '../common/FruitImage';
import { RefreshCw, Search, Calendar } from 'lucide-react';

function getTodayYYYYMMDD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const AdminTransactionHistory: React.FC = () => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await InventoryService.getLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      if (selectedDate !== 'all') {
        const logDate = log.createdAt.split('T')[0];
        if (logDate !== selectedDate) return false;
      }
      if (!q) return true;
      return (
        (log.fruitName && log.fruitName.toLowerCase().includes(q)) ||
        log.inventoryId.toLowerCase().includes(q) ||
        (log.userName && log.userName.toLowerCase().includes(q)) ||
        log.action.toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery, selectedDate]);

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Transaction History</h1>
      <p className="admin-page-desc">Every action recorded in the system.</p>

      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search item, user, action..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`admin-chip ${selectedDate === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedDate('all')}
        >All Time</button>
        <div className="uab-datepicker-wrap" onClick={e => {
          const inp = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
          if (inp && typeof inp.showPicker === 'function') inp.showPicker();
        }}>
          <Calendar size={14} />
          <input
            type="date"
            className="uab-date-input"
            value={selectedDate === 'all' ? getTodayYYYYMMDD() : selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`uab-today-btn ${selectedDate === getTodayYYYYMMDD() ? 'uab-today-active' : ''}`}
          onClick={() => setSelectedDate(getTodayYYYYMMDD())}
        >Today</button>
        <button className="uab-refresh-btn" onClick={handleRefresh} disabled={refreshing} type="button">
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <p className="admin-result-count">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {selectedDate === 'all' ? ' (all time)' : ` on ${selectedDate}`}
        {searchQuery.trim() && ` matching "${searchQuery.trim()}"`}
      </p>

      {loading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <p className="admin-empty-text">No transactions found.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Recipient</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className={log.reversed ? 'row-reversed' : ''}>
                  <td className="admin-table-time">{formatDateTime(log.createdAt)}</td>
                  <td>
                    <span className="admin-user-badge">{log.userName || '—'}</span>
                  </td>
                  <td>
                    <span className={`action-badge action-${log.action.toLowerCase()}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FruitImage fruitName={log.fruitName || ''} size={26} />
                      <span>{log.fruitName}</span>
                    </div>
                  </td>
                  <td><strong>{log.quantity}</strong></td>
                  <td>{log.recipient || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
