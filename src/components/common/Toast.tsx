import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useInventory();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  const renderIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      case 'info':
      default:
        return <Info size={20} color="#3b82f6" />;
    }
  };

  return (
    <div className={`toast-notification toast-${toast.type}`}>
      {renderIcon()}
      <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</span>
      <button className="close-btn" onClick={hideToast} style={{ width: 28, height: 28 }} type="button">
        <X size={16} />
      </button>
    </div>
  );
};
