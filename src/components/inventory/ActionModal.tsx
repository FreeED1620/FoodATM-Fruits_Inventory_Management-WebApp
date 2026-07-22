import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useInventory } from '../../context/InventoryContext';
import { ActionType } from '../../types/inventory';
import { getFruitIcon } from '../../utils/formatters';
import { ShoppingCart, Send, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

const BRANCH_OPTIONS = [
  'Branch 1 (Main Cold Storage)',
  'Branch 2 (North Warehouse)',
  'Branch 3 (South Warehouse)',
  'Branch 4 (East Warehouse)',
];

export const ActionModal: React.FC = () => {
  const {
    isActionModalOpen,
    closeActionModal,
    selectedItemForAction: item,
    recordItemAction,
  } = useInventory();

  const [activeAction, setActiveAction] = useState<ActionType>('SELL');
  const [quantity, setQuantity] = useState<string>('');
  const [targetBranch, setTargetBranch] = useState<string>(BRANCH_OPTIONS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (item && isActionModalOpen) {
      setQuantity('10');
      setTargetBranch(BRANCH_OPTIONS[0]);
      setErrorMsg(null);
      setActiveAction('SELL');
    }
  }, [item, isActionModalOpen]);

  if (!item) return null;

  const maxQty = item.quantity;
  const fruitIcon = getFruitIcon(item.fruitName);

  const handleFullQuantity = () => {
    setQuantity(String(maxQty));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Please enter a valid quantity greater than 0.');
      return;
    }

    if (qtyNum > maxQty) {
      setErrorMsg(`Quantity cannot exceed available stock of ${maxQty} ${item.unit}.`);
      return;
    }

    const recipientValue = activeAction === 'TRANSFER' ? targetBranch : undefined;

    setSubmitting(true);
    const success = await recordItemAction({
      itemId: item.id,
      inventoryId: item.inventoryId,
      action: activeAction,
      quantity: qtyNum,
      recipient: recipientValue,
    });
    setSubmitting(false);

    if (success) {
      closeActionModal();
    }
  };

  return (
    <Modal
      isOpen={isActionModalOpen}
      onClose={closeActionModal}
      title={`Inventory Action: ${item.inventoryId}`}
    >
      {/* Selected Item Summary Header */}
      <div
        style={{
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.8rem' }}>{fruitIcon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{item.fruitName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Batch #{item.batchNumber} • ID: <strong style={{ color: 'var(--id-pill-text)' }}>{item.inventoryId}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Available Stock
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
            {item.quantity} {item.unit}
          </div>
        </div>
      </div>

      {/* Action Type Tabs */}
      <div className="action-tabs">
        <button
          type="button"
          className={`tab-btn ${activeAction === 'SELL' ? 'active active-sell' : ''}`}
          onClick={() => setActiveAction('SELL')}
        >
          <ShoppingCart size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Sell
        </button>

        <button
          type="button"
          className={`tab-btn ${activeAction === 'DISTRIBUTE' ? 'active active-distribute' : ''}`}
          onClick={() => setActiveAction('DISTRIBUTE')}
        >
          <Send size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Distribute
        </button>

        <button
          type="button"
          className={`tab-btn ${activeAction === 'TRANSFER' ? 'active active-transfer' : ''}`}
          onClick={() => setActiveAction('TRANSFER')}
        >
          <ArrowRightLeft size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Transfer
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Quantity to process */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label className="form-label">Quantity to {activeAction.toLowerCase()} *</label>
            <button
              type="button"
              onClick={handleFullQuantity}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Select Max ({maxQty} {item.unit})
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              step="any"
              min="0.1"
              max={maxQty}
              className="form-input"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder={`Enter amount in ${item.unit}`}
              maxLength={8}
              required
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 1rem',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {item.unit}
            </div>
          </div>
        </div>

        {/* Branch Dropdown Menu for Transfer Action Only */}
        {activeAction === 'TRANSFER' && (
          <div className="form-group">
            <label className="form-label">Target Branch Location *</label>
            <select
              className="form-select"
              value={targetBranch}
              onChange={e => setTargetBranch(e.target.value)}
              required
            >
              {BRANCH_OPTIONS.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="form-error" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={closeActionModal} style={{ flex: 1 }}>
            Cancel
          </button>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2 }}>
            <CheckCircle2 size={18} />
            <span>{submitting ? 'Processing...' : `Confirm ${activeAction}`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
