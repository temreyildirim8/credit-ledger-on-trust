import { offlineCache, type SyncQueueItem, type CachedCustomer, type CachedTransaction } from './offline-cache';
import { supabase } from '@/lib/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/lib/database.types';

export interface OfflineActionResult {
  success: boolean;
  id?: string;
  error?: string;
  isOffline: boolean;
}

/**
 * SyncService handles offline-first data operations and background synchronization.
 *
 * When the device is offline:
 * 1. Operations are stored in IndexedDB sync queue
 * 2. Data is optimistically updated in local cache
 * 3. UI shows "pending" status
 *
 * When the device comes back online:
 * 1. Service worker triggers background sync
 * 2. Pending operations are processed in order
 * 3. Local cache is updated with server responses
 */
export class SyncService {
  private static instance: SyncService | null = null;
  private syncInProgress = false;
  private listeners: Set<(pendingCount: number) => void> = new Set();

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Subscribe to sync queue changes
   */
  subscribe(listener: (pendingCount: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async notifyListeners(): Promise<void> {
    const count = await offlineCache.getPendingSyncCount();
    this.listeners.forEach((listener) => listener(count));
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Create a new customer - works offline
   */
  async createCustomer(
    userId: string,
    data: { name: string; phone?: string; address?: string; notes?: string }
  ): Promise<OfflineActionResult> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    if (this.isOnline()) {
      try {
        const insertData: TablesInsert<'customers'> = {
          user_id: userId,
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          notes: data.notes || null,
        };

        const { data: customer, error } = await supabase
          .from('customers')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        // Cache the new customer
        await offlineCache.setCustomer({
          id: customer.id,
          user_id: customer.user_id!,
          name: customer.name!,
          phone: customer.phone,
          address: customer.address,
          notes: customer.notes,
          balance: 0,
          transaction_count: 0,
          is_deleted: false,
          created_at: customer.created_at,
          _cachedAt: Date.now(),
        });

        return { success: true, id: customer.id, isOffline: false };
      } catch (error) {
        console.error('Failed to create customer online, falling back to offline:', error);
        // Fall through to offline mode
      }
    }

    // Offline mode: queue the operation
    await offlineCache.addToSyncQueue({
      action_type: 'create_customer',
      payload: {
        user_id: userId,
        temp_id: tempId,
        name: data.name,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
      },
      client_timestamp: now,
      retry_count: 0,
      max_retries: 3,
      status: 'pending',
    });

    // Optimistically add to local cache
    await offlineCache.setCustomer({
      id: tempId,
      user_id: userId,
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
      balance: 0,
      transaction_count: 0,
      is_deleted: false,
      created_at: now,
      _cachedAt: Date.now(),
    });

    await this.notifyListeners();

    return { success: true, id: tempId, isOffline: true };
  }

  /**
   * Create a new transaction - works offline
   */
  async createTransaction(
    userId: string,
    data: { customerId: string; type: 'debt' | 'payment'; amount: number; note?: string; date?: string }
  ): Promise<OfflineActionResult> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const transactionDate = data.date || now;

    if (this.isOnline()) {
      try {
        const insertData: TablesInsert<'transactions'> = {
          user_id: userId,
          customer_id: data.customerId,
          type: data.type,
          amount: data.amount,
          description: data.note || null,
          transaction_date: transactionDate,
        };

        const { data: transaction, error } = await supabase
          .from('transactions')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        // Cache the new transaction
        await offlineCache.setTransaction({
          id: transaction.id,
          customer_id: transaction.customer_id,
          type: transaction.type as 'debt' | 'payment',
          amount: transaction.amount,
          description: transaction.description,
          transaction_date: transaction.transaction_date,
          created_at: transaction.created_at,
          _cachedAt: Date.now(),
        });

        return { success: true, id: transaction.id, isOffline: false };
      } catch (error) {
        console.error('Failed to create transaction online, falling back to offline:', error);
        // Fall through to offline mode
      }
    }

    // Offline mode: queue the operation
    await offlineCache.addToSyncQueue({
      action_type: 'create_transaction',
      payload: {
        user_id: userId,
        temp_id: tempId,
        customer_id: data.customerId,
        type: data.type,
        amount: data.amount,
        note: data.note,
        transaction_date: transactionDate,
      },
      client_timestamp: now,
      retry_count: 0,
      max_retries: 3,
      status: 'pending',
    });

    // Optimistically add to local cache
    await offlineCache.setTransaction({
      id: tempId,
      customer_id: data.customerId,
      type: data.type,
      amount: data.amount,
      description: data.note || null,
      transaction_date: transactionDate,
      created_at: now,
      _cachedAt: Date.now(),
    });

    // Update customer balance in cache
    await this.updateCachedCustomerBalance(data.customerId, data.type, data.amount);

    await this.notifyListeners();

    return { success: true, id: tempId, isOffline: true };
  }

  /**
   * Update customer balance in local cache
   */
  private async updateCachedCustomerBalance(
    customerId: string,
    type: 'debt' | 'payment',
    amount: number
  ): Promise<void> {
    try {
      // Get all cached customers and find the one to update
      const cachedCustomers = await offlineCache.getCustomers('');
      const customer = cachedCustomers.find((c) => c.id === customerId);

      if (customer) {
        const balanceChange = type === 'debt' ? amount : -amount;
        await offlineCache.setCustomer({
          ...customer,
          balance: customer.balance + balanceChange,
          _cachedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to update cached customer balance:', error);
    }
  }

  /**
   * Process all pending sync items
   */
  async processSyncQueue(): Promise<{ processed: number; failed: number }> {
    if (this.syncInProgress) {
      console.log('[SyncService] Sync already in progress, skipping');
      return { processed: 0, failed: 0 };
    }

    if (!this.isOnline()) {
      console.log('[SyncService] Device is offline, cannot sync');
      return { processed: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let processed = 0;
    let failed = 0;

    try {
      const pendingItems = await offlineCache.getSyncQueue('pending');
      console.log(`[SyncService] Processing ${pendingItems.length} pending items`);

      for (const item of pendingItems) {
        try {
          // Mark as syncing
          await offlineCache.updateSyncQueueItem(item.id, { status: 'syncing' });

          const result = await this.processSyncItem(item);

          if (result.success) {
            // Remove from queue on success
            await offlineCache.removeSyncQueueItem(item.id);
            processed++;

            // Update local cache with server ID if it was a create operation
            if (result.serverId && item.payload.temp_id) {
              await this.replaceTempIdInCache(
                item.action_type,
                item.payload.temp_id as string,
                result.serverId
              );
            }
          } else {
            // Update retry count and status
            const newRetryCount = item.retry_count + 1;
            const status = newRetryCount >= item.max_retries ? 'failed' : 'pending';

            await offlineCache.updateSyncQueueItem(item.id, {
              retry_count: newRetryCount,
              status,
              error_message: result.error,
            });
            failed++;
          }
        } catch (error) {
          console.error(`[SyncService] Error processing item ${item.id}:`, error);
          failed++;

          const newRetryCount = item.retry_count + 1;
          await offlineCache.updateSyncQueueItem(item.id, {
            retry_count: newRetryCount,
            status: newRetryCount >= item.max_retries ? 'failed' : 'pending',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      await this.notifyListeners();

      // Notify service worker of sync completion
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_COMPLETE',
          processed,
          failed,
          timestamp: Date.now(),
        });
      }

      console.log(`[SyncService] Sync complete: ${processed} processed, ${failed} failed`);
    } finally {
      this.syncInProgress = false;
    }

    return { processed, failed };
  }

  /**
   * Process a single sync queue item
   */
  private async processSyncItem(
    item: SyncQueueItem
  ): Promise<{ success: boolean; serverId?: string; error?: string }> {
    switch (item.action_type) {
      case 'create_customer':
        return this.processCreateCustomer(item.payload);
      case 'create_transaction':
        return this.processCreateTransaction(item.payload);
      default:
        return { success: false, error: `Unknown action type: ${item.action_type}` };
    }
  }

  private async processCreateCustomer(
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; serverId?: string; error?: string }> {
    try {
      const insertData: TablesInsert<'customers'> = {
        user_id: payload.user_id as string,
        name: payload.name as string,
        phone: (payload.phone as string) || null,
        address: (payload.address as string) || null,
        notes: (payload.notes as string) || null,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, serverId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async processCreateTransaction(
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; serverId?: string; error?: string }> {
    try {
      // Check if customer_id is a temp ID that needs to be resolved
      let customerId = payload.customer_id as string;

      // If it's a temp ID, check if we have a mapping or if the customer was synced
      if (customerId.startsWith('temp_')) {
        // Try to find the real customer by looking at the sync queue for customer creates
        const customers = await offlineCache.getCustomers('');
        const realCustomer = customers.find(
          (c) => c.id === customerId || c.name === payload.customer_name
        );

        if (realCustomer && !realCustomer.id.startsWith('temp_')) {
          customerId = realCustomer.id;
        } else {
          return { success: false, error: 'Customer not yet synced' };
        }
      }

      const insertData: TablesInsert<'transactions'> = {
        user_id: payload.user_id as string,
        customer_id: customerId,
        type: payload.type as 'debt' | 'payment',
        amount: payload.amount as number,
        description: (payload.note as string) || null,
        transaction_date: payload.transaction_date as string,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, serverId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Replace temporary IDs in cache with server IDs
   */
  private async replaceTempIdInCache(
    actionType: string,
    tempId: string,
    serverId: string
  ): Promise<void> {
    try {
      if (actionType === 'create_customer') {
        const customers = await offlineCache.getCustomers('');
        const customer = customers.find((c) => c.id === tempId);

        if (customer) {
          // Delete old temp entry
          await offlineCache.deleteCustomer(tempId);

          // Add with server ID
          await offlineCache.setCustomer({
            ...customer,
            id: serverId,
            _cachedAt: Date.now(),
          });
        }
      } else if (actionType === 'create_transaction') {
        // For transactions, we need to delete and re-add with new ID
        // This is a simplified approach - in production you'd want more robust handling
        await offlineCache.setTransaction({
          id: serverId,
          customer_id: '', // Would need to resolve this
          type: 'debt',
          amount: 0,
          description: null,
          transaction_date: null,
          created_at: null,
          _cachedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to replace temp ID in cache:', error);
    }
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    return offlineCache.getPendingSyncCount();
  }

  /**
   * Trigger background sync via Service Worker
   */
  async triggerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;

        if (registration.sync) {
          await registration.sync.register('sync-transactions');
          console.log('[SyncService] Background sync registered');
        } else {
          // Fallback: process immediately
          console.log('[SyncService] Background Sync API not available, processing immediately');
          await this.processSyncQueue();
        }
      } catch (error) {
        console.error('[SyncService] Failed to trigger background sync:', error);
        // Fallback: process immediately
        await this.processSyncQueue();
      }
    } else {
      // No service worker, process immediately
      await this.processSyncQueue();
    }
  }
}

export const syncService = SyncService.getInstance();
