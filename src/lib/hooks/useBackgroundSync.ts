"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { offlineCache, SyncQueueItem } from "@/lib/pwa/offline-cache";
import { customersService } from "@/lib/services/customers.service";
import { transactionsService } from "@/lib/services/transactions.service";
import { toast } from "sonner";

interface SyncResult {
  success: number;
  failed: number;
  total: number;
}

/**
 * Hook to process background sync queue when coming back online
 * - Listens for online event
 * - Processes pending sync items
 * - Shows toast notifications for sync status
 */
export function useBackgroundSync() {
  const { user } = useAuth();
  const isSyncingRef = useRef(false);

  const processSyncQueue = useCallback(async (): Promise<SyncResult> => {
    if (!user?.id) {
      return { success: 0, failed: 0, total: 0 };
    }

    // Prevent concurrent sync operations
    if (isSyncingRef.current) {
      console.log("[BackgroundSync] Sync already in progress, skipping");
      return { success: 0, failed: 0, total: 0 };
    }

    isSyncingRef.current = true;

    try {
      // Initialize cache
      await offlineCache.init();

      // Get pending items
      const pendingItems = await offlineCache.getSyncQueue("pending");
      const total = pendingItems.length;

      if (total === 0) {
        console.log("[BackgroundSync] No pending items to sync");
        return { success: 0, failed: 0, total: 0 };
      }

      console.log(`[BackgroundSync] Processing ${total} pending items`);
      toast.info(`Syncing ${total} offline changes...`);

      let success = 0;
      let failed = 0;

      // Process each item
      for (const item of pendingItems) {
        try {
          // Mark as syncing
          await offlineCache.updateSyncQueueItem(item.id, { status: "syncing" });

          // Process based on action type
          await processSyncItem(item, user.id);

          // Mark as completed
          await offlineCache.updateSyncQueueItem(item.id, { status: "completed" });
          success++;
        } catch (error) {
          console.error(`[BackgroundSync] Failed to sync item ${item.id}:`, error);

          // Increment retry count
          const newRetryCount = item.retry_count + 1;
          if (newRetryCount >= item.max_retries) {
            await offlineCache.updateSyncQueueItem(item.id, {
              status: "failed",
              error_message: error instanceof Error ? error.message : "Unknown error",
            });
            failed++;
          } else {
            await offlineCache.updateSyncQueueItem(item.id, {
              retry_count: newRetryCount,
              status: "pending",
            });
            // Don't count as failed - will retry next time
          }
        }
      }

      // Show result toast
      if (failed > 0) {
        toast.error(`Synced ${success} items, ${failed} failed`);
      } else if (success > 0) {
        toast.success(`Successfully synced ${success} offline changes`);
      }

      return { success, failed, total };
    } catch (error) {
      console.error("[BackgroundSync] Error processing sync queue:", error);
      toast.error("Failed to sync offline changes");
      return { success: 0, failed: 0, total: 0 };
    } finally {
      isSyncingRef.current = false;
    }
  }, [user?.id]);

  // Process sync queue when coming online
  useEffect(() => {
    const handleOnline = () => {
      console.log("[BackgroundSync] Back online, processing sync queue");
      processSyncQueue();
    };

    window.addEventListener("online", handleOnline);

    // Also check on initial load if online
    if (navigator.onLine) {
      // Delay to let the app initialize
      const timer = setTimeout(() => {
        processSyncQueue();
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("online", handleOnline);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [processSyncQueue]);

  return {
    processSyncQueue,
    getPendingCount: async () => offlineCache.getPendingSyncCount(),
    getPendingItems: async () => offlineCache.getSyncQueue("pending"),
  };
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: SyncQueueItem, _userId: string): Promise<void> {
  switch (item.action_type) {
    case "create_customer": {
      const payload = item.payload as {
        userId: string;
        customer: {
          name: string;
          phone?: string;
          address?: string;
          notes?: string;
        };
        tempId: string;
      };

      // Create customer on server
      const newCustomer = await customersService.createCustomer(
        payload.userId,
        payload.customer
      );

      // Remove temp customer from cache and add real one
      await offlineCache.deleteCustomer(payload.tempId);
      await offlineCache.setCustomer({
        id: newCustomer.id,
        user_id: newCustomer.user_id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        notes: newCustomer.notes,
        balance: newCustomer.balance || 0,
        transaction_count: null,
        last_transaction_date: null,
        is_deleted: false,
        created_at: newCustomer.created_at,
        _cachedAt: Date.now(),
      });

      console.log(`[BackgroundSync] Created customer ${newCustomer.id} (was ${payload.tempId})`);
      break;
    }

    case "create_transaction": {
      const payload = item.payload as {
        userId: string;
        transaction: {
          customerId: string;
          type: "debt" | "payment";
          amount: number;
          note?: string;
          date?: string;
        };
        tempId: string;
      };

      // Check if customer_id is a temp ID - if so, find the real one
      const customerId = payload.transaction.customerId;
      if (customerId.startsWith("temp_")) {
        // Find the corresponding sync item for the customer
        const pendingItems = await offlineCache.getSyncQueue("completed");
        const customerItem = pendingItems.find(
          (i) =>
            i.action_type === "create_customer" &&
            (i.payload as { tempId?: string }).tempId === customerId
        );

        if (customerItem && customerItem.status === "completed") {
          // The customer was already synced, we need to find the real ID
          // This would require storing the mapping somewhere
          // For now, throw an error and retry later
          throw new Error("Customer sync mapping not found");
        } else {
          throw new Error("Customer not yet synced");
        }
      }

      // Create transaction on server
      const newTransaction = await transactionsService.createTransaction(
        payload.userId,
        {
          customerId,
          type: payload.transaction.type,
          amount: payload.transaction.amount,
          note: payload.transaction.note,
          date: payload.transaction.date,
        }
      );

      // Update cache with real transaction
      await offlineCache.setTransaction({
        id: newTransaction.id,
        customer_id: newTransaction.customer_id,
        type: newTransaction.type,
        amount: newTransaction.amount,
        description: newTransaction.description,
        transaction_date: newTransaction.transaction_date,
        created_at: newTransaction.created_at,
        customer_name: undefined,
        _cachedAt: Date.now(),
      });

      console.log(`[BackgroundSync] Created transaction ${newTransaction.id}`);
      break;
    }

    case "update_customer": {
      const payload = item.payload as {
        customerId: string;
        updates: Record<string, unknown>;
      };

      // Skip temp IDs
      if (payload.customerId.startsWith("temp_")) {
        throw new Error("Customer not yet synced");
      }

      await customersService.updateCustomer(payload.customerId, payload.updates);
      console.log(`[BackgroundSync] Updated customer ${payload.customerId}`);
      break;
    }

    case "delete_customer": {
      const payload = item.payload as {
        customerId: string;
      };

      // Skip temp IDs
      if (payload.customerId.startsWith("temp_")) {
        // Already removed from local cache, just mark as complete
        break;
      }

      await customersService.deleteCustomer(payload.customerId);
      await offlineCache.deleteCustomer(payload.customerId);
      console.log(`[BackgroundSync] Deleted customer ${payload.customerId}`);
      break;
    }

    default:
      throw new Error(`Unknown action type: ${item.action_type}`);
  }
}
