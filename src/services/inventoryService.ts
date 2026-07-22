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

  static async addFruit(input: AddFruitInput): Promise<InventoryItem> {
    const client = requireSupabase();
    const existingItems = await this.getItems();

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

    const payload = this.mapToSupabase(newItem);
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

  static async recordAction(input: ActionInput): Promise<{ updatedItem: InventoryItem; log: InventoryLog }> {
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
      id: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      itemId: targetItem.id,
      inventoryId: targetItem.inventoryId,
      action: input.action,
      quantity: Math.round(input.quantity),
      recipient: input.action === 'TRANSFER' ? (input.recipient || null) : null,
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
      }]);

    if (logError) {
      throw new Error(`Failed to record action log: ${logError.message}`);
    }

    return { updatedItem, log: newLog };
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
