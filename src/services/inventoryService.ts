import {
  ActionInput,
  AddFruitInput,
  InventoryItem,
  InventoryLog,
} from '../types/inventory';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { INITIAL_MOCK_ITEMS, INITIAL_MOCK_LOGS } from './mockData';
import { generateInventoryId, getNextSeqNumber } from '../utils/idGenerator';
import { sortByNearestExpiry } from '../utils/dateUtils';

const LOCAL_STORAGE_KEY_ITEMS = 'foodatm_inventory_items_v1';
const LOCAL_STORAGE_KEY_LOGS = 'foodatm_inventory_logs_v1';

export class InventoryService {
  /**
   * Fetch all inventory items, sorted by nearest expiry date
   */
  static async getItems(): Promise<InventoryItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) {
        console.error('Supabase fetch error:', error);
        throw new Error(`Supabase Error (${error.code}): ${error.message}`);
      }
      
      if (data) {
        return data.map(item => this.mapFromSupabase(item));
      }
    }

    // Local Storage Fallback only when Supabase environment variables are NOT configured
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(INITIAL_MOCK_ITEMS));
      return sortByNearestExpiry(INITIAL_MOCK_ITEMS);
    }

    try {
      const parsed: InventoryItem[] = JSON.parse(stored);
      return sortByNearestExpiry(parsed);
    } catch {
      return sortByNearestExpiry(INITIAL_MOCK_ITEMS);
    }
  }

  /**
   * Adds a new fruit entry as an independent record
   */
  static async addFruit(input: AddFruitInput): Promise<InventoryItem> {
    const existingItems = isSupabaseConfigured ? await this.getItems() : [];
    
    // Auto-calculate sequential number for the specified batch
    const seqNumber = getNextSeqNumber(existingItems, input.batchNumber);
    const categoryCode = input.categoryCode || 'F';
    const inventoryId = generateInventoryId(input.batchNumber, categoryCode, seqNumber);

    const newItem: InventoryItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      inventoryId,
      fruitName: input.fruitName.trim(),
      categoryCode,
      quantity: Math.round(Number(input.quantity)),
      unit: 'boxes',
      batchNumber: Number(input.batchNumber),
      seqNumber,
      receivedDate: input.receivedDate,
      expiryDate: input.expiryDate,
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const payload = this.mapToSupabase(newItem);
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Supabase Insert Failed:', error);
        throw new Error(`Supabase Error (${error.code}): ${error.message}`);
      }

      if (data) {
        return this.mapFromSupabase(data);
      }
    }

    // Local Storage Fallback only when Supabase is not configured
    const currentLocal = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS) || '[]');
    const updatedList = [newItem, ...currentLocal];
    localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(updatedList));
    return newItem;
  }

  /**
   * Record a Sell, Distribute, or Transfer action on an inventory item
   */
  static async recordAction(input: ActionInput): Promise<{ updatedItem: InventoryItem; log: InventoryLog }> {
    const items = await this.getItems();
    const targetItem = items.find(i => i.id === input.itemId);

    if (!targetItem) {
      throw new Error(`Inventory item ${input.inventoryId} not found.`);
    }

    if (input.quantity > targetItem.quantity) {
      throw new Error(`Cannot ${input.action.toLowerCase()} ${input.quantity} boxes. Available quantity is ${targetItem.quantity} boxes.`);
    }

    const newQuantity = Math.max(0, targetItem.quantity - Math.round(input.quantity));
    const newStatus = newQuantity === 0 ? (input.action === 'SELL' ? 'SOLD' : input.action === 'DISTRIBUTE' ? 'DISTRIBUTED' : 'TRANSFERRED') : targetItem.status;

    const updatedItem: InventoryItem = {
      ...targetItem,
      quantity: newQuantity,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const newLog: InventoryLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      itemId: targetItem.id,
      inventoryId: targetItem.inventoryId,
      action: input.action,
      quantity: Math.round(input.quantity),
      // Only store recipient for TRANSFER (branch name); null for SELL/DISTRIBUTE
      recipient: input.action === 'TRANSFER' ? (input.recipient || null) : null,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      // Update item quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity, status: newStatus })
        .eq('id', targetItem.id);

      if (updateError) {
        throw new Error(`Supabase Action Error: ${updateError.message}`);
      }

      // Insert action log
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert([{
          inventory_item_id: targetItem.id,
          inventory_id: targetItem.inventoryId,
          action: input.action,
          quantity_affected: Math.round(input.quantity),
          // Only store recipient for TRANSFER (branch name); null for SELL/DISTRIBUTE
          recipient_destination: input.action === 'TRANSFER' ? (input.recipient || null) : null,
        }]);

      if (logError) {
        throw new Error(`Supabase Log Error: ${logError.message}`);
      }
    } else {
      // Local Storage Fallback update
      const updatedItems = items.map(i => i.id === targetItem.id ? updatedItem : i);
      localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(updatedItems));

      const logs = this.getLocalLogs();
      localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify([newLog, ...logs]));
    }

    return { updatedItem, log: newLog };
  }

  /**
   * Fetch inventory action audit logs
   */
  static getLocalLogs(): InventoryLog[] {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_LOGS);
    if (!stored) return INITIAL_MOCK_LOGS;
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_MOCK_LOGS;
    }
  }

  /**
   * Reset local storage state for testing
   */
  static resetToMockData(): InventoryItem[] {
    localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(INITIAL_MOCK_ITEMS));
    localStorage.setItem(LOCAL_STORAGE_KEY_LOGS, JSON.stringify(INITIAL_MOCK_LOGS));
    return sortByNearestExpiry(INITIAL_MOCK_ITEMS);
  }

  /* DB Mappers - strictly matches Supabase inventory_items table schema */
  private static mapFromSupabase(row: any): InventoryItem {
    return {
      id: row.id,
      inventoryId: row.inventory_id,
      fruitName: row.fruit_name,
      categoryCode: row.category_code || 'F',
      quantity: Number(row.quantity),
      unit: row.unit || 'boxes',
      batchNumber: row.batch_number,
      seqNumber: row.seq_number,
      receivedDate: row.received_date,
      expiryDate: row.expiry_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapToSupabase(item: InventoryItem): any {
    return {
      id: item.id,
      inventory_id: item.inventoryId,
      fruit_name: item.fruitName,
      category_code: item.categoryCode,
      quantity: item.quantity,
      batch_number: item.batchNumber,
      seq_number: item.seqNumber,
      received_date: item.receivedDate,
      expiry_date: item.expiryDate,
      status: item.status,
    };
  }
}
