import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useInventory } from '../../context/InventoryContext';
import { ActionType } from '../../types/inventory';
import { getFruitIcon } from '../../utils/formatters';
import { isSupabaseConfigured, supabase } from '../../services/supabaseClient';
import { ShoppingCart, Send, ArrowRightLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ActionModal: React.FC = () => {
  const {
    isActionModalOpen,
    closeActionModal,
    selectedItemForAction: item,
    recordItemAction,
    markExpired,
  } = useInventory();

  const [activeAction, setActiveAction] = useState<ActionType>('SELL');
  const [quantity, setQuantity] = useState<string>('');
  const [targetBranch, setTargetBranch] = useState<string>('');
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const safeClose = () => {
    if (!submitting) closeActionModal();
  };

  useEffect(() => {
    const fetchBranches = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      const { data } = await supabase
        .from('foodatmbranches')
        .select('name')
        .order('name');
      if (data) {
        const names = data.map((b: { name: string }) => b.name);
        setBranchOptions(names);
        if (names.length > 0) setTargetBranch(names[0]);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (item && isActionModalOpen) {
      setQuantity('10');
      setTargetBranch(branchOptions[0] || '');
      setErrorMsg(null);
      setActiveAction('SELL');
    }
  }, [item, isActionModalOpen, branchOptions]);

  if (!item) return null;

  const maxQty = item.quantity;
  const fruitIcon = getFruitIcon(item.fruitName);

  const handleFullQuantity = () => {
    setQuantity(String(maxQty));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeAction === 'EXPIRED') {
      setSubmitting(true);
      const success = await markExpired(item.id);
      setSubmitting(false);
      if (success) {
        closeActionModal();
      }
      return;
    }

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
      onClose={safeClose}
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

        <button
          type="button"
          className={`tab-btn ${activeAction === 'EXPIRED' ? 'active active-expired' : ''}`}
          onClick={() => setActiveAction('EXPIRED')}
        >
          <AlertTriangle size={15} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Expired
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Quantity to process — hidden for EXPIRED */}
        {activeAction !== 'EXPIRED' && (
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
              onChange={e => setQuantity(e.target.value.slice(0, 4))}
              placeholder={`Enter amount in ${item.unit}`}
              maxLength={4}
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
        )}

        {/* Expired info message */}
        {activeAction === 'EXPIRED' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>The entire item ({item.quantity} {item.unit}) will be marked as <strong>expired</strong> and moved to the Expired section.</span>
          </div>
        )}

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
              {branchOptions.map(branch => (
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
          <button type="button" className="btn btn-secondary" onClick={safeClose} disabled={submitting} style={{ flex: 1 }}>
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
