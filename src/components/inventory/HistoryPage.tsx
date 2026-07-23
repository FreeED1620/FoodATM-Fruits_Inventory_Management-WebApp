import React, { useEffect, useState } from 'react';
import { ArrowLeft, Undo2, ShoppingCart, Gift, ArrowRightLeft, CheckCircle2, Clock } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryLog } from '../../types/inventory';
import { formatDateTime } from '../../utils/dateUtils';
import { ConfirmModal } from '../common/ConfirmModal';

interface HistoryPageProps {
  onBack: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onBack }) => {
  const { logs, fetchLogs, undoAction, loading } = useInventory();
  const [undoTarget, setUndoTarget] = useState<InventoryLog | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleConfirmUndo = async () => {
    if (!undoTarget) return;
    setUndoing(true);
    const success = await undoAction(undoTarget.id);
    setUndoing(false);
    if (success) setUndoTarget(null);
  };

  const isWithinUndoWindow = (createdAt: string): boolean => {
    const logTime = new Date(createdAt).getTime();
    const now = Date.now();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    return now - logTime <= threeHoursMs;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'SELL': return <ShoppingCart size={16} />;
      case 'DISTRIBUTE': return <Gift size={16} />;
      case 'TRANSFER': return <ArrowRightLeft size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SELL': return '#059669';
      case 'DISTRIBUTE': return '#7c3aed';
      case 'TRANSFER': return '#2563eb';
      default: return '#64748b';
    }
  };

  const activeLogs = logs.filter(l => !l.reversed);
  const reversedLogs = logs.filter(l => l.reversed && l.reversedAt && isWithinUndoWindow(l.reversedAt));

  return (
    <div className="history-page">
      <div className="history-header">
        <button className="history-back-btn" onClick={onBack} type="button">
          <ArrowLeft size={20} />
        </button>
        <h2 className="history-title">Transaction History</h2>
      </div>

      {loading && logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
        </div>
      ) : activeLogs.length === 0 && reversedLogs.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">No Transactions Yet</h3>
          <p className="empty-desc">When you sell, distribute, or transfer fruits, those transactions will appear here.</p>
        </div>
      ) : (
        <>
          {activeLogs.length > 0 && (
            <div className="history-section">
              <h3 className="history-section-title">Active Transactions</h3>
              {activeLogs.map(log => (
                <div key={log.id} className="history-log-card">
                  <div className="log-card-left">
                    <div className="log-action-icon" style={{ color: getActionColor(log.action), background: `${getActionColor(log.action)}15` }}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="log-info">
                      <div className="log-fruit-name">{log.fruitName}</div>
                      <div className="log-meta">
                        <span className="log-action-badge" style={{ color: getActionColor(log.action) }}>{log.action}</span>
                        <span className="log-qty">{log.quantity} boxes</span>
                        {log.recipient && <span className="log-recipient">→ {log.recipient}</span>}
                      </div>
                      <div className="log-date">{formatDateTime(log.createdAt)}</div>
                    </div>
                  </div>
                  {isWithinUndoWindow(log.createdAt) && (
                    <button
                      className="log-undo-btn"
                      onClick={() => setUndoTarget(log)}
                      type="button"
                      title="Undo this transaction"
                    >
                      <Undo2 size={15} />
                      <span>Undo</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {reversedLogs.length > 0 && (
            <div className="history-section">
              <h3 className="history-section-title" style={{ color: '#94a3b8' }}>Undone Transactions</h3>
              {reversedLogs.map(log => (
                <div key={log.id} className="history-log-card reversed">
                  <div className="log-card-left">
                    <div className="log-action-icon reversed-icon">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="log-info">
                      <div className="log-fruit-name">{log.fruitName}</div>
                      <div className="log-meta">
                        <span className="log-action-badge" style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{log.action}</span>
                        <span className="log-qty" style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{log.quantity} boxes</span>
                      </div>
                      <div className="log-date" style={{ color: '#94a3b8' }}>
                        Undone {log.reversedAt ? formatDateTime(log.reversedAt) : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!undoTarget}
        onClose={() => setUndoTarget(null)}
        onConfirm={handleConfirmUndo}
        title="Undo Transaction"
        message={undoTarget ? `Restore ${undoTarget.quantity} boxes of ${undoTarget.fruitName} back to inventory? This will reverse the ${undoTarget.action.toLowerCase()} action.` : ''}
        confirmText={undoing ? 'Undoing...' : 'Yes, Undo'}
        cancelText="Cancel"
        danger
      />
    </div>
  );
};
