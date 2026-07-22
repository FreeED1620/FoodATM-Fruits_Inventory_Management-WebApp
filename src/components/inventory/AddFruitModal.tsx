import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useInventory } from '../../context/InventoryContext';
import { getFutureDateString, getTodayString, isValidDateRange } from '../../utils/dateUtils';
import { generateInventoryId, getNextSeqNumber } from '../../utils/idGenerator';
import { POPULAR_FRUITS, WAREHOUSE_UNITS } from '../../utils/formatters';
import { CategoryCode } from '../../types/inventory';
import { Sparkles } from 'lucide-react';

export const AddFruitModal: React.FC = () => {
  const { isAddModalOpen, closeAddModal, addFruit, items } = useInventory();

  // Default values
  const today = getTodayString();
  const defaultExpiry = getFutureDateString(7);

  const [fruitName, setFruitName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('50');
  const [unit, setUnit] = useState<string>('boxes');
  // Allow string state so backspacing works naturally on mobile keyboards!
  const [batchInput, setBatchInput] = useState<string>('1');
  const [categoryCode, setCategoryCode] = useState<CategoryCode>('F');
  const [receivedDate, setReceivedDate] = useState<string>(today);
  const [expiryDate, setExpiryDate] = useState<string>(defaultExpiry);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Auto-calculated Inventory ID Preview
  const [predictedId, setPredictedId] = useState<string>('B01-F001');

  useEffect(() => {
    if (isAddModalOpen) {
      // Find highest batch number currently in system or default to 1
      const activeBatches = items.map(i => i.batchNumber);
      const latestBatch = activeBatches.length > 0 ? Math.max(...activeBatches) : 1;
      setBatchInput(String(latestBatch));
      setCategoryCode('F');
      setUnit('boxes');
      setReceivedDate(getTodayString());
      setExpiryDate(getFutureDateString(7));
      setFruitName('');
      setQuantity('50');
      setFormError(null);
    }
  }, [isAddModalOpen, items]);

  const parsedBatchNumber = parseInt(batchInput.trim(), 10) || 1;

  useEffect(() => {
    const seq = getNextSeqNumber(items, parsedBatchNumber);
    setPredictedId(generateInventoryId(parsedBatchNumber, categoryCode, seq));
  }, [items, parsedBatchNumber, categoryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form Validations
    if (!fruitName.trim()) {
      setFormError('Please enter or select a fruit name.');
      return;
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setFormError('Quantity must be a positive number greater than 0.');
      return;
    }

    if (parsedBatchNumber < 1) {
      setFormError('Batch number must be 1 or higher.');
      return;
    }

    if (!receivedDate) {
      setFormError('Please select a valid received date.');
      return;
    }

    if (!expiryDate) {
      setFormError('Please select a valid expiry date.');
      return;
    }

    if (!isValidDateRange(receivedDate, expiryDate)) {
      setFormError('Expiry Date cannot be earlier than Received Date!');
      return;
    }

    setSubmitting(true);
    const success = await addFruit({
      fruitName: fruitName.trim(),
      quantity: numQty,
      unit: 'boxes',
      batchNumber: parsedBatchNumber,
      categoryCode,
      receivedDate,
      expiryDate,
    });
    setSubmitting(false);

    if (success) {
      closeAddModal();
    }
  };

  return (
    <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Add New Fruit Record">
      <form onSubmit={handleSubmit}>
        {/* Auto Generated Inventory ID Preview */}
        <div className="id-preview-box">
          <div>
            <div className="id-preview-label">Auto-Generated Inventory ID</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sequential ID assigned automatically
            </div>
          </div>
          <div className="id-preview-value">{predictedId}</div>
        </div>

        {/* Fruit Name Input - NO autoFocus so keyboard doesn't open automatically on mobile */}
        <div className="form-group">
          <label className="form-label">Fruit Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Apple, Banana, Orange..."
            value={fruitName}
            onChange={e => setFruitName(e.target.value)}
            maxLength={50}
            required
          />

          {/* Quick Suggestion Chips */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            {POPULAR_FRUITS.slice(0, 6).map(name => (
              <button
                key={name}
                type="button"
                className="chip-btn"
                style={{ fontSize: '0.75rem', minHeight: '30px', padding: '0 0.5rem' }}
                onClick={() => setFruitName(name)}
              >
                + {name}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Batch Number Row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={categoryCode}
              onChange={e => setCategoryCode(e.target.value as CategoryCode)}
            >
              <option value="F">Fruit (F)</option>
              <option value="V">Vegetables (V)</option>
              <option value="D">Dry Fruits (D)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Batch # (Lorry) *</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={batchInput}
              onChange={e => setBatchInput(e.target.value)}
              placeholder="e.g. 1"
              maxLength={6}
              required
            />
          </div>
        </div>

        {/* Quantity & Unit Row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input
              type="number"
              step="any"
              min="1"
              className="form-input"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              maxLength={8}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit *</label>
            <select
              className="form-select"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            >
              {WAREHOUSE_UNITS.map(u => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates Row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Received Date *</label>
            <input
              type="date"
              className="form-input"
              value={receivedDate}
              onChange={e => setReceivedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expiry Date *</label>
            <input
              type="date"
              className="form-input"
              value={expiryDate}
              min={receivedDate}
              onChange={e => setExpiryDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Form Error */}
        {formError && (
          <div className="form-error" style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
            ⚠️ {formError}
          </div>
        )}

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={closeAddModal}
            style={{ flex: 1 }}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ flex: 2 }}
          >
            <Sparkles size={18} />
            <span>{submitting ? 'Saving Record...' : 'Save Fruit Record'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
