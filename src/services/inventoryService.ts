import {
  ActionInput,
  AddFruitInput,
  InventoryItem,
  InventoryLog,
} from '../types/inventory';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { generateInventoryId, getNextSeqNumber } from '../utils/idGenerator';
import { sortByNearestExpiry } from '../utils/dateUtils';

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }
  return supabase;
}

export class InventoryService {
  static async getItems(): Promise<InventoryItem[]> {
    const client = requireSupabase();

    const { data, error } = await client
      .from('inventory_items')
      .select('*')
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw new Error(`Supabase Error (${error.code}): ${error.message}`);
    }

    return sortByNearestExpiry(data.map(item => this.mapFromSupabase(item)));
  }

  static async addFruit(input: AddFruitInput, shiftNumber: number): Promise<InventoryItem> {
    const client = requireSupabase();
    const existingItems = await this.getItems();

    const seqNumber = getNextSeqNumber(existingItems, input.batchNumber);
    const categoryCode = input.categoryCode || 'F';
    const inventoryId = generateInventoryId(input.batchNumber, categoryCode, seqNumber);

    const newItem: InventoryItem = {
      id: '',
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
      addedInShift: shiftNumber,
      createdAt: new Date().toISOString(),
    };

    const payload = this.mapToSupabase(newItem);
    delete payload.id;
    payload.added_in_shift = shiftNumber;
    const { data, error } = await client
      .from('inventory_items')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Failed:', error);
      throw new Error(`Failed to add item: ${error.message}`);
    }

    return this.mapFromSupabase(data);
  }

  static async recordAction(input: ActionInput, shiftNumber: number): Promise<{ updatedItem: InventoryItem; log: InventoryLog }> {
    const client = requireSupabase();
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
      id: '',
      itemId: targetItem.id,
      inventoryId: targetItem.inventoryId,
      action: input.action,
      quantity: Math.round(input.quantity),
      recipient: input.action === 'TRANSFER' ? (input.recipient || null) : null,
      shiftNumber,
      reversed: false,
      reversedAt: null,
      createdAt: new Date().toISOString(),
    };

    const { error: updateError } = await client
      .from('inventory_items')
      .update({ quantity: newQuantity, status: newStatus })
      .eq('id', targetItem.id);

    if (updateError) {
      throw new Error(`Failed to update item: ${updateError.message}`);
    }

    const { error: logError } = await client
      .from('inventory_logs')
      .insert([{
        inventory_item_id: targetItem.id,
        inventory_id: targetItem.inventoryId,
        action: input.action,
        quantity_affected: Math.round(input.quantity),
        recipient_destination: input.action === 'TRANSFER' ? (input.recipient || null) : null,
        shift_number: shiftNumber,
      }]);

    if (logError) {
      throw new Error(`Failed to record action log: ${logError.message}`);
    }

    return { updatedItem, log: newLog };
  }

  static async getLogs(): Promise<InventoryLog[]> {
    const client = requireSupabase();

    const { data, error } = await client
      .from('inventory_logs')
      .select('*, inventory_items(fruit_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch logs error:', error);
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      itemId: row.inventory_item_id,
      inventoryId: row.inventory_id,
      action: row.action,
      quantity: Number(row.quantity_affected),
      recipient: row.recipient_destination,
      shiftNumber: row.shift_number || 1,
      reversed: row.reversed || false,
      reversedAt: row.reversed_at || null,
      createdAt: row.created_at,
      fruitName: row.inventory_items?.fruit_name || 'Unknown',
    }));
  }

  static async undoAction(logId: string): Promise<void> {
    const client = requireSupabase();

    const { data: log, error: logFetchError } = await client
      .from('inventory_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (logFetchError || !log) {
      throw new Error('Log entry not found.');
    }

    if (log.reversed) {
      throw new Error('This action has already been undone.');
    }

    const logTime = new Date(log.created_at).getTime();
    const now = Date.now();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    if (now - logTime > threeHoursMs) {
      throw new Error('This transaction is older than 3 hours and cannot be undone.');
    }

    const { data: item, error: itemError } = await client
      .from('inventory_items')
      .select('*')
      .eq('id', log.inventory_item_id)
      .single();

    if (itemError || !item) {
      throw new Error('Associated inventory item not found.');
    }

    const restoredQuantity = Number(item.quantity) + Number(log.quantity_affected);
    const { error: updateError } = await client
      .from('inventory_items')
      .update({ quantity: restoredQuantity, status: 'AVAILABLE' })
      .eq('id', log.inventory_item_id);

    if (updateError) {
      throw new Error(`Failed to restore quantity: ${updateError.message}`);
    }

    const { error: reverseError } = await client
      .from('inventory_logs')
      .update({ reversed: true, reversed_at: new Date().toISOString() })
      .eq('id', logId);

    if (reverseError) {
      throw new Error(`Failed to mark log as reversed: ${reverseError.message}`);
    }
  }

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
      addedInShift: row.added_in_shift || 1,
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
