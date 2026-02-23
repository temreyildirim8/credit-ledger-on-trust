"use client";

import { offlineCache, CachedCustomer, CachedTransaction, SyncQueueItem } from "./offline-cache";
import { customersService, Customer } from "@/lib/services/customers.service";
import { transactionsService, Transaction } from "@/lib/services/transactions.service";

/**
 * Offline-aware data service
 * - Fetches from Supabase when online and caches results
 * - Returns cached data when offline
 * - Queues mutations when offline for background sync
 */
class OfflineDataService {
  private isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  // =====================
  // CUSTOMERS
  // =====================

  /**
   * Get customers - from Supabase if online, from cache if offline
   */
  async getCustomers(userId: string): Promise<Customer[]> {
    if (this.isOnline()) {
      try {
        const customers = await customersService.getCustomers(userId);
        // Cache the results for offline access
        await this.cacheCustomers(userId, customers);
        return customers;
      } catch (error) {
        console.error("[OfflineData] Failed to fetch customers, falling back to cache:", error);
        // Fall back to cache on error
        return this.getCachedCustomers(userId);
      }
    } else {
      // Offline: return cached data
      return this.getCachedCustomers(userId);
    }
  }

  private async cacheCustomers(userId: string, customers: Customer[]): Promise<void> {
    const cachedCustomers: CachedCustomer[] = customers.map((c) => ({
      id: c.id,
      user_id: c.user_id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      balance: c.balance,
      transaction_count: c.transaction_count,
      last_transaction_date: c.last_transaction_date,
      is_deleted: c.is_deleted,
      created_at: c.created_at,
      _cachedAt: Date.now(),
    }));

    await offlineCache.setCustomers(userId, cachedCustomers);
  }

  private async getCachedCustomers(userId: string): Promise<Customer[]> {
    const cached = await offlineCache.getCustomers(userId);
    return cached.map((c) => ({
      id: c.id,
      user_id: c.user_id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      balance: c.balance,
      transaction_count: c.transaction_count,
      last_transaction_date: c.last_transaction_date,
      is_deleted: c.is_deleted,
      created_at: c.created_at,
    }));
  }

  /**
   * Create customer - queue if offline
   */
  async createCustomer(
    userId: string,
    customer: { name: string; phone?: string; address?: string; notes?: string }
  ): Promise<Customer> {
    if (this.isOnline()) {
      const newCustomer = await customersService.createCustomer(userId, customer);
      // Cache the new customer
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
      return newCustomer;
    } else {
      // Offline: create a temporary customer and queue for sync
      const tempId = `temp_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempCustomer: Customer = {
        id: tempId,
        user_id: userId,
        name: customer.name,
        phone: customer.phone || null,
        address: customer.address || null,
        notes: customer.notes || null,
        balance: 0,
        transaction_count: 0,
        last_transaction_date: null,
        is_deleted: false,
        created_at: new Date().toISOString(),
      };

      // Cache the temporary customer
      await offlineCache.setCustomer({
        ...tempCustomer,
        _cachedAt: Date.now(),
      });

      // Queue for sync
      await offlineCache.addToSyncQueue({
        action_type: "create_customer",
        payload: {
          temp_id: tempId,
          user_id: userId,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          notes: customer.notes,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: "pending",
      });

      return tempCustomer;
    }
  }

  /**
   * Archive customer - queue if offline
   */
  async archiveCustomer(customerId: string): Promise<void> {
    if (this.isOnline()) {
      await customersService.archiveCustomer(customerId);
      // Update cache
      await offlineCache.deleteCustomer(customerId);
    } else {
      // Queue for sync
      await offlineCache.addToSyncQueue({
        action_type: "delete_customer",
        payload: {
          customer_id: customerId,
          soft_delete: true,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: "pending",
      });

      // Update local cache
      await offlineCache.deleteCustomer(customerId);
    }
  }

  /**
   * Delete customer - queue if offline
   */
  async deleteCustomer(customerId: string): Promise<void> {
    if (this.isOnline()) {
      await customersService.deleteCustomer(customerId);
      await offlineCache.deleteCustomer(customerId);
    } else {
      await offlineCache.addToSyncQueue({
        action_type: "delete_customer",
        payload: {
          customer_id: customerId,
          soft_delete: false,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: "pending",
      });

      await offlineCache.deleteCustomer(customerId);
    }
  }

  // =====================
  // TRANSACTIONS
  // =====================

  /**
   * Get transactions - from Supabase if online, from cache if offline
   */
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (this.isOnline()) {
      try {
        const transactions = await transactionsService.getTransactions(userId);
        // Cache the results
        await this.cacheTransactions(transactions);
        return transactions;
      } catch (error) {
        console.error("[OfflineData] Failed to fetch transactions, falling back to cache:", error);
        return this.getCachedTransactions();
      }
    } else {
      return this.getCachedTransactions();
    }
  }

  private async cacheTransactions(transactions: Transaction[]): Promise<void> {
    const cachedTransactions: CachedTransaction[] = transactions.map((t) => ({
      id: t.id,
      customer_id: t.customer_id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      transaction_date: t.transaction_date,
      created_at: t.created_at,
      customer_name: t.customer_name,
      _cachedAt: Date.now(),
    }));

    await offlineCache.setTransactions("", cachedTransactions);
  }

  private async getCachedTransactions(): Promise<Transaction[]> {
    const cached = await offlineCache.getTransactions();
    return cached.map((t) => ({
      id: t.id,
      customer_id: t.customer_id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      transaction_date: t.transaction_date,
      created_at: t.created_at,
      customer_name: t.customer_name,
    }));
  }

  /**
   * Create transaction - queue if offline
   */
  async createTransaction(
    userId: string,
    transaction: {
      customerId: string;
      type: "debt" | "payment";
      amount: number;
      note?: string;
      date?: string;
    }
  ): Promise<Transaction> {
    if (this.isOnline()) {
      const newTransaction = await transactionsService.createTransaction(userId, transaction);
      // Cache the new transaction
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
      return newTransaction;
    } else {
      // Offline: create a temporary transaction and queue for sync
      const tempId = `temp_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempTransaction: Transaction = {
        id: tempId,
        customer_id: transaction.customerId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.note || null,
        transaction_date: transaction.date || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Cache the temporary transaction
      await offlineCache.setTransaction({
        ...tempTransaction,
        _cachedAt: Date.now(),
      });

      // Queue for sync
      await offlineCache.addToSyncQueue({
        action_type: "create_transaction",
        payload: {
          temp_id: tempId,
          user_id: userId,
          customer_id: transaction.customerId,
          type: transaction.type,
          amount: transaction.amount,
          note: transaction.note,
          date: transaction.date || new Date().toISOString(),
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: "pending",
      });

      return tempTransaction;
    }
  }

  // =====================
  // SYNC
  // =====================

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    return offlineCache.getPendingSyncCount();
  }

  /**
   * Get all pending sync items
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return offlineCache.getSyncQueue("pending");
  }

  /**
   * Process sync queue - called when coming back online
   */
  async processSyncQueue(): Promise<{ success: number; failed: number }> {
    const pendingItems = await offlineCache.getSyncQueue("pending");
    let success = 0;
    let failed = 0;

    for (const item of pendingItems) {
      try {
        // Mark as syncing
        await offlineCache.updateSyncQueueItem(item.id, { status: "syncing" });

        // Process based on action type
        switch (item.action_type) {
          case "create_customer": {
            const { user_id, name, phone, address, notes, temp_id } = item.payload as {
              user_id: string;
              name: string;
              phone?: string;
              address?: string;
              notes?: string;
              temp_id: string;
            };
            const newCustomer = await customersService.createCustomer(user_id, {
              name,
              phone,
              address,
              notes,
            });
            // Update cache with real ID
            await offlineCache.deleteCustomer(temp_id);
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
            break;
          }

          case "create_transaction": {
            const { user_id, customer_id, type, amount, note, date, temp_id } = item.payload as {
              user_id: string;
              customer_id: string;
              type: "debt" | "payment";
              amount: number;
              note?: string;
              date: string;
              temp_id: string;
            };
            // Check if customer_id is a temp ID - if so, skip (customer not synced yet)
            if (customer_id.startsWith("temp_customer_")) {
              throw new Error("Customer not yet synced");
            }
            const newTransaction = await transactionsService.createTransaction(user_id, {
              customerId: customer_id,
              type,
              amount,
              note,
              date,
            });
            // Update cache with real ID
            const cached = await offlineCache.getTransactions();
            const tempTx = cached.find((t) => t.id === temp_id);
            if (tempTx) {
              await offlineCache.setTransaction({
                ...newTransaction,
                _cachedAt: Date.now(),
              });
            }
            break;
          }

          case "delete_customer": {
            const { customer_id, soft_delete } = item.payload as {
              customer_id: string;
              soft_delete: boolean;
            };
            // Skip temp IDs
            if (customer_id.startsWith("temp_")) {
              break;
            }
            if (soft_delete) {
              await customersService.archiveCustomer(customer_id);
            } else {
              await customersService.deleteCustomer(customer_id);
            }
            break;
          }

          default:
            throw new Error(`Unknown action type: ${item.action_type}`);
        }

        // Mark as completed
        await offlineCache.updateSyncQueueItem(item.id, { status: "completed" });
        success++;
      } catch (error) {
        console.error(`[OfflineData] Failed to sync item ${item.id}:`, error);

        // Increment retry count
        const newRetryCount = item.retry_count + 1;
        if (newRetryCount >= item.max_retries) {
          await offlineCache.updateSyncQueueItem(item.id, {
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          });
        } else {
          await offlineCache.updateSyncQueueItem(item.id, {
            retry_count: newRetryCount,
            status: "pending",
          });
        }
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await offlineCache.clear();
  }
}

export const offlineDataService = new OfflineDataService();
