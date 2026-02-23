/**
 * Background Sync Processor
 *
 * Processes queued actions from IndexedDB and syncs them with Supabase.
 * Used by the service worker and the main app when coming back online.
 */

import { offlineCache, SyncQueueItem } from './offline-cache';
import { customersService } from '@/lib/services/customers.service';
import { transactionsService } from '@/lib/services/transactions.service';
import { createClient } from '@/lib/supabase/client';

export interface SyncResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{ itemId: string; error: string }>;
}

/**
 * Process all pending items in the sync queue
 */
export async function processSyncQueue(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    processedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // Initialize cache
    await offlineCache.init();

    // Get all pending items
    const pendingItems = await offlineCache.getSyncQueue('pending');

    if (pendingItems.length === 0) {
      console.log('[SyncProcessor] No pending items to sync');
      return result;
    }

    console.log(`[SyncProcessor] Processing ${pendingItems.length} pending items`);

    // Process each item
    for (const item of pendingItems) {
      try {
        // Mark as syncing
        await offlineCache.updateSyncQueueItem(item.id, { status: 'syncing' });

        // Process based on action type
        await processSyncItem(item);

        // Mark as completed and remove from queue
        await offlineCache.updateSyncQueueItem(item.id, { status: 'completed' });
        await offlineCache.removeSyncQueueItem(item.id);

        result.processedCount++;
        console.log(`[SyncProcessor] Successfully synced item ${item.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[SyncProcessor] Failed to sync item ${item.id}:`, errorMessage);

        // Update retry count and status
        const newRetryCount = item.retry_count + 1;
        const shouldRetry = newRetryCount < item.max_retries;

        await offlineCache.updateSyncQueueItem(item.id, {
          retry_count: newRetryCount,
          status: shouldRetry ? 'pending' : 'failed',
          error_message: errorMessage,
        });

        result.failedCount++;
        result.errors.push({ itemId: item.id, error: errorMessage });
      }
    }

    result.success = result.failedCount === 0;
  } catch (error) {
    console.error('[SyncProcessor] Error processing sync queue:', error);
    result.success = false;
  }

  // Notify service worker or main thread about sync completion
  if (typeof window !== 'undefined') {
    window.postMessage(
      {
        type: 'SYNC_COMPLETE',
        processedCount: result.processedCount,
        failedCount: result.failedCount,
        timestamp: Date.now(),
      },
      '*'
    );
  }

  return result;
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: SyncQueueItem): Promise<void> {
  const { action_type, payload } = item;

  switch (action_type) {
    case 'create_customer':
      await processCreateCustomer(payload);
      break;
    case 'update_customer':
      await processUpdateCustomer(payload);
      break;
    case 'delete_customer':
      await processDeleteCustomer(payload);
      break;
    case 'create_transaction':
      await processCreateTransaction(payload);
      break;
    case 'update_transaction':
      await processUpdateTransaction(payload);
      break;
    default:
      throw new Error(`Unknown action type: ${action_type}`);
  }
}

/**
 * Process create customer action
 */
async function processCreateCustomer(payload: Record<string, unknown>): Promise<void> {
  const { userId, customer, tempId } = payload as {
    userId: string;
    customer: { name: string; phone?: string; address?: string; notes?: string };
    tempId?: string;
  };

  const newCustomer = await customersService.createCustomer(userId, customer);

  // If there was a temp ID, update the cache
  if (tempId) {
    await offlineCache.deleteCustomer(tempId);
    await offlineCache.setCustomer({
      ...newCustomer,
      user_id: userId,
      _cachedAt: Date.now(),
    });
  }
}

/**
 * Process update customer action
 */
async function processUpdateCustomer(payload: Record<string, unknown>): Promise<void> {
  const { customerId, updates } = payload as {
    customerId: string;
    updates: Record<string, unknown>;
  };

  await customersService.updateCustomer(customerId, updates);
}

/**
 * Process delete customer action
 */
async function processDeleteCustomer(payload: Record<string, unknown>): Promise<void> {
  const { customerId } = payload as { customerId: string };
  await customersService.deleteCustomer(customerId);
  await offlineCache.deleteCustomer(customerId);
}

/**
 * Process create transaction action
 */
async function processCreateTransaction(payload: Record<string, unknown>): Promise<void> {
  const { userId, transaction, tempId } = payload as {
    userId: string;
    transaction: {
      customerId: string;
      type: 'debt' | 'payment';
      amount: number;
      note?: string;
      date?: string;
    };
    tempId?: string;
  };

  const newTransaction = await transactionsService.createTransaction(userId, transaction);

  // If there was a temp ID, update the cache
  if (tempId) {
    // Delete the temp transaction from cache by getting all and filtering
    const cachedTxs = await offlineCache.getTransactions();
    const tempTx = cachedTxs.find((t) => t.id === tempId);
    if (tempTx) {
      // We can't delete by ID directly, so we'll overwrite with the real one
      // The cache will be refreshed on next load
    }
    await offlineCache.setTransaction({
      ...newTransaction,
      _cachedAt: Date.now(),
    });
  }
}

/**
 * Process update transaction action
 */
async function processUpdateTransaction(payload: Record<string, unknown>): Promise<void> {
  const { transactionId, updates } = payload as {
    transactionId: string;
    updates: Record<string, unknown>;
  };

  // Note: transactionsService doesn't have updateTransaction yet
  // This would be implemented when needed
  const supabase = createClient();
  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId);

  if (error) throw error;
}

/**
 * Get the current sync queue status
 */
export async function getSyncQueueStatus(): Promise<{
  pendingCount: number;
  failedCount: number;
  oldestPendingAt: Date | null;
}> {
  try {
    await offlineCache.init();

    const pendingItems = await offlineCache.getSyncQueue('pending');
    const failedItems = await offlineCache.getSyncQueue('failed');

    const oldestPendingAt =
      pendingItems.length > 0 ? new Date(pendingItems[0]._addedAt) : null;

    return {
      pendingCount: pendingItems.length,
      failedCount: failedItems.length,
      oldestPendingAt,
    };
  } catch (error) {
    console.error('[SyncProcessor] Error getting sync queue status:', error);
    return {
      pendingCount: 0,
      failedCount: 0,
      oldestPendingAt: null,
    };
  }
}

/**
 * Retry failed sync items
 */
export async function retryFailedItems(): Promise<void> {
  try {
    await offlineCache.init();

    const failedItems = await offlineCache.getSyncQueue('failed');

    for (const item of failedItems) {
      await offlineCache.updateSyncQueueItem(item.id, {
        status: 'pending',
        retry_count: 0,
        error_message: undefined,
      });
    }

    console.log(`[SyncProcessor] Reset ${failedItems.length} failed items to pending`);
  } catch (error) {
    console.error('[SyncProcessor] Error retrying failed items:', error);
  }
}
