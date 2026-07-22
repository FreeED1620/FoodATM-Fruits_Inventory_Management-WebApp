import { CategoryCode, InventoryItem } from '../types/inventory';

/**
 * Formats batch integer into batch prefix (e.g. 1 -> "B01", 12 -> "B12")
 */
export function formatBatchPrefix(batchNumber: number): string {
  const padded = String(Math.max(1, batchNumber)).padStart(2, '0');
  return `B${padded}`;
}

/**
 * Formats sequential integer into 3-digit string (e.g. 1 -> "001", 42 -> "042")
 */
export function formatSeqNumber(seq: number): string {
  return String(Math.max(1, seq)).padStart(3, '0');
}

/**
 * Generates official FoodATM Inventory ID
 * Example: B01-F001
 */
export function generateInventoryId(
  batchNumber: number,
  categoryCode: CategoryCode = 'F',
  seqNumber: number
): string {
  const batchPrefix = formatBatchPrefix(batchNumber);
  const seqPadded = formatSeqNumber(seqNumber);
  return `${batchPrefix}-${categoryCode}${seqPadded}`;
}

/**
 * Computes the next available sequential number for a specific batch.
 * Inspects all existing inventory records for matching batchNumber.
 */
export function getNextSeqNumber(existingItems: InventoryItem[], batchNumber: number): number {
  const itemsInBatch = existingItems.filter(item => item.batchNumber === Number(batchNumber));
  
  if (itemsInBatch.length === 0) {
    return 1;
  }

  const maxSeq = itemsInBatch.reduce((max, item) => {
    return item.seqNumber > max ? item.seqNumber : max;
  }, 0);

  return maxSeq + 1;
}

/**
 * Helper to parse an existing inventory ID into components
 * e.g. "B01-F005" -> { batchNumber: 1, categoryCode: 'F', seqNumber: 5 }
 */
export function parseInventoryId(inventoryId: string): {
  batchNumber: number;
  categoryCode: CategoryCode;
  seqNumber: number;
} | null {
  const regex = /^B(\d+)-([A-Z])(\d+)$/;
  const match = inventoryId.trim().match(regex);
  if (!match) return null;

  return {
    batchNumber: parseInt(match[1], 10),
    categoryCode: match[2] as CategoryCode,
    seqNumber: parseInt(match[3], 10),
  };
}
