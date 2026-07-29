import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FruitImage } from '../common/FruitImage';
import { useInventory } from '../../context/InventoryContext';
import { getFutureDateString, getTodayString, isValidDateRange } from '../../utils/dateUtils';
import { CategoryCode } from '../../types/inventory';
import { Sparkles, Check } from 'lucide-react';
import { FruitImageService, FruitImageRecord } from '../../services/fruitImageService';

export const AddFruitModal: React.FC = () => {
  const { isAddModalOpen, closeAddModal, addFruit, items } = useInventory();

  const today = getTodayString();
  const defaultExpiry = getFutureDateString(7);

  const [fruitName, setFruitName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [batchInput, setBatchInput] = useState<string>('');
  const [categoryCode, setCategoryCode] = useState<CategoryCode>('F');
  const [receivedDate, setReceivedDate] = useState<string>(today);
  const [expiryDate, setExpiryDate] = useState<string>(defaultExpiry);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fruitOptions, setFruitOptions] = useState<FruitImageRecord[]>([]);

  const handleClose = () => {
    if (!submitting) closeAddModal();
  };

  useEffect(() => {
    if (isAddModalOpen) {
      setBatchInput('');
      setCategoryCode('F');
      setReceivedDate(getTodayString());
      setExpiryDate(getFutureDateString(7));
      setFruitName('');
      setQuantity('');
      setFormError(null);

      FruitImageService.getAll()
        .then(data => setFruitOptions(data))
        .catch(() => setFruitOptions([]));
    }
  }, [isAddModalOpen, items]);

  const parsedBatchNumber = batchInput.trim() ? parseInt(batchInput.trim(), 10) : NaN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fruitName.trim()) {
      setFormError('Please select or enter a fruit name.');
      return;
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setFormError('Quantity must be a positive number.');
      return;
    }

    if (!batchInput.trim() || isNaN(parsedBatchNumber) || parsedBatchNumber < 1) {
      setFormError('Batch number must be 1 or higher.');
      return;
    }

    if (!receivedDate) {
      setFormError('Please select a received date.');
      return;
    }

    if (!expiryDate) {
      setFormError('Please select an expiry date.');
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
    <Modal isOpen={isAddModalOpen} onClose={handleClose} title="Add New Fruit Record">
      <form onSubmit={handleSubmit}>
        {/* Scrollable Fruit Image Strip */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Fruit Name *</label>
          {fruitOptions.length > 0 ? (
            <div className="fruit-scroll-strip">
              {fruitOptions.map(fruit => {
                const isSelected = fruitName.toLowerCase() === fruit.fruitName.toLowerCase();
                return (
                  <button
                    key={fruit.fruitName}
                    type="button"
                    className={`fruit-tile ${isSelected ? 'selected' : ''}`}
                    onClick={() => setFruitName(fruit.fruitName)}
                  >
                    <FruitImage fruitName={fruit.fruitName} size={40} className="fruit-tile-img" />
                    <span className="fruit-tile-name">{fruit.fruitName}</span>
                    {isSelected && (
                      <div className="tile-check-badge">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              No fruits defined yet. Admin can add them in Manage Fruits.
            </p>
          )}

          {/* Optional custom fruit input */}
          <div style={{ marginTop: '0.65rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Or type custom fruit name..."
              value={fruitName}
              onChange={e => setFruitName(e.target.value)}
              maxLength={30}
              required
            />
          </div>
        </div>

        {/* Quantity & Batch Row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input
              type="number"
              step="any"
              min="1"
              className="form-input"
              value={quantity}
              onChange={e => setQuantity(e.target.value.slice(0, 4))}
              placeholder="50"
              maxLength={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Batch *</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={batchInput}
              onChange={e => setBatchInput(e.target.value.slice(0, 4))}
              placeholder="1"
              maxLength={4}
              required
            />
          </div>
        </div>

        {/* Dates Row */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Received Date *</label>
            <input
              type="date"
              className="form-input date-input"
              value={receivedDate}
              onChange={e => setReceivedDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expiry Date *</label>
            <input
              type="date"
              className="form-input date-input"
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
            {formError}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={submitting}
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
