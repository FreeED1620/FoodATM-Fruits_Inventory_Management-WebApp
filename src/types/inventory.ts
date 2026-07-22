export type CategoryCode = 'F' | 'V' | 'D';

export type InventoryStatus = 'AVAILABLE' | 'SOLD' | 'DISTRIBUTED' | 'TRANSFERRED' | 'EXPIRED';

export type ActionType = 'SELL' | 'DISTRIBUTE' | 'TRANSFER';

export interface InventoryItem {
  id: string;
  inventoryId: string; // e.g. "B01-F001"
  fruitName: string;
  categoryCode: CategoryCode;
  quantity: number;
  unit: string; // "kg", "boxes", "crates"
  batchNumber: number;
  seqNumber: number;
  receivedDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  status: InventoryStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AddFruitInput {
  fruitName: string;
  quantity: number;
  unit: string;
  batchNumber: number;
  receivedDate: string;
  expiryDate: string;
  categoryCode?: CategoryCode;
}

export interface ActionInput {
  itemId: string;
  inventoryId: string;
  action: ActionType;
  quantity: number;
  recipient?: string; // Only required for TRANSFER (branch name)
}

export interface InventoryLog {
  id: string;
  itemId: string;
  inventoryId: string;
  action: ActionType;
  quantity: number;
  recipient: string | null; // Branch name for TRANSFER, null for SELL/DISTRIBUTE
  createdAt: string;
}

export type ExpiryUrgency = 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'FRESH';

export interface ExpiryStatus {
  urgency: ExpiryUrgency;
  daysRemaining: number;
  label: string;
}

export interface InventoryStats {
  totalItems: number;
  totalQuantityKg: number;
  expiringSoonCount: number;
  expiredCount: number;
  activeBatchesCount: number;
}
