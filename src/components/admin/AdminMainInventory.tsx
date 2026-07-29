import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { FruitImage } from '../common/FruitImage';
import { Modal } from '../common/Modal';

export const AdminMainInventory: React.FC = () => {
  const { items } = useInventory();
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);

  const fruits = useMemo(() => {
    const fruitSet = new Set<string>();
    items.forEach(item => {
      if (item.status === 'AVAILABLE') {
        fruitSet.add(item.fruitName);
      }
    });
    return Array.from(fruitSet)
      .sort()
      .map(name => ({ fruitName: name }));
  }, [items]);

  const availableBatches = useMemo(() => {
    if (!selectedFruit) return [];
    return items
      .filter(item => item.fruitName === selectedFruit && item.status === 'AVAILABLE')
      .sort((a, b) => a.batchNumber - b.batchNumber);
  }, [items, selectedFruit]);

  const totalQty = availableBatches.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Main Inventory Items</h1>
      <p className="admin-page-desc">
        Click a fruit to view available stock by batch.
      </p>

      {fruits.length === 0 ? (
        <p className="admin-empty-text">
          No available inventory items found.
        </p>
      ) : (
        <div className="ami-grid">
          {fruits.map(fruit => (
            <button
              key={fruit.fruitName}
              className="ami-card"
              onClick={() => setSelectedFruit(fruit.fruitName)}
              type="button"
            >
              <FruitImage fruitName={fruit.fruitName} size={64} className="ami-card-img" />
              <span className="ami-card-name">{fruit.fruitName}</span>
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={selectedFruit !== null}
        onClose={() => setSelectedFruit(null)}
        title={selectedFruit || ''}
      >
        {selectedFruit && (
          <>
            <div className="ami-modal-header">
              <FruitImage fruitName={selectedFruit} size={48} />
              <div>
                <h3 className="ami-modal-fruit-name">{selectedFruit}</h3>
                <p className="ami-modal-summary">{availableBatches.length} batch{availableBatches.length !== 1 ? 'es' : ''} · {totalQty} boxes total</p>
              </div>
            </div>

            {availableBatches.length === 0 ? (
              <p className="tab-empty-text">No available stock for this fruit.</p>
            ) : (
              <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th>Received</th>
                      <th>Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableBatches.map(item => (
                      <tr key={item.id}>
                        <td><strong>B{item.batchNumber}</strong></td>
                        <td><strong>{item.quantity}</strong></td>
                        <td>{item.receivedDate}</td>
                        <td>{item.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};
