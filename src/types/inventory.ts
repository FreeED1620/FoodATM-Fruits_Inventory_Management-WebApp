export type CategoryCode = 'F' | 'V' | 'D';

export type InventoryStatus = 'AVAILABLE' | 'SOLD' | 'DISTRIBUTED' | 'TRANSFERRED' | 'EXPIRED' | 'DISPOSED';

export type ActionType = 'SELL' | 'DISTRIBUTE' | 'TRANSFER' | 'EXPIRED' | 'DISPOSE';

export interface InventoryItem {
  id: string;
  inventoryId: string;
  fruitName: string;
  categoryCode: CategoryCode;
  quantity: number;
  unit: string;
  batchNumber: number;
  seqNumber: number;
  receivedDate: string;
  expiryDate: string;
  status: InventoryStatus;
  sessionId: string | null;
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
  recipient?: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  inventoryId: string;
  action: ActionType;
  quantity: number;
  recipient: string | null;
  sessionId: string | null;
  reversed: boolean;
  reversedAt: string | null;
  createdAt: string;
  fruitName?: string;
  userName?: string;
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
