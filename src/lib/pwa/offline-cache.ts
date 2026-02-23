const DB_NAME = 'global-ledger-offline';
const DB_VERSION = 2;

// Store names
export const STORES = {
  CACHE: 'offline-cache',
  CUSTOMERS: 'customers',
  TRANSACTIONS: 'transactions',
  SYNC_QUEUE: 'sync-queue',
} as const;

export interface OfflineData<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
}

export interface CachedCustomer {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address?: string | null;
  notes?: string | null;
  balance: number;
  transaction_count?: number | null;
  last_transaction_date?: string | null;
  is_deleted?: boolean | null;
  created_at: string | null;
  _cachedAt: number;
}

export interface CachedTransaction {
  id: string;
  customer_id: string;
  type: 'debt' | 'payment';
  amount: number;
  description: string | null;
  transaction_date: string | null;
  created_at: string | null;
  customer_name?: string;
  _cachedAt: number;
}

export interface SyncQueueItem {
  id: string;
  action_type: 'create_customer' | 'update_customer' | 'delete_customer' | 'create_transaction' | 'update_transaction';
  payload: Record<string, unknown>;
  client_timestamp: string;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error_message?: string;
  _addedAt: number;
}

// Cache expiry time (24 hours)
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export class OfflineCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Generic cache store
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Customers store
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customersStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
          customersStore.createIndex('user_id', 'user_id', { unique: false });
          customersStore.createIndex('_cachedAt', '_cachedAt', { unique: false });
        }

        // Transactions store
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transactionsStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          transactionsStore.createIndex('customer_id', 'customer_id', { unique: false });
          transactionsStore.createIndex('_cachedAt', '_cachedAt', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('action_type', 'action_type', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Failed to initialize IndexedDB');
    return this.db;
  }

  // Generic cache methods
  async set<T>(key: string, data: T): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], 'readwrite');
      const objectStore = transaction.objectStore(STORES.CACHE);

      const offlineData: OfflineData<T> = {
        key,
        data,
        timestamp: Date.now(),
      };

      const request = objectStore.put(offlineData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache data'));
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE], 'readonly');
      const objectStore = transaction.objectStore(STORES.CACHE);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const result = request.result as OfflineData<T> | undefined;
        if (result && Date.now() - result.timestamp < CACHE_EXPIRY_MS) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error('Failed to retrieve cached data'));
    });
  }

  // Customer methods
  async setCustomers(userId: string, customers: CachedCustomer[]): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CUSTOMERS], 'readwrite');
      const objectStore = transaction.objectStore(STORES.CUSTOMERS);
      const timestamp = Date.now();

      let completed = 0;
      const total = customers.length;

      if (total === 0) {
        resolve();
        return;
      }

      customers.forEach((customer) => {
        const request = objectStore.put({
          ...customer,
          _cachedAt: timestamp,
        });

        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(new Error('Failed to cache customer'));
      });
    });
  }

  async getCustomers(userId: string): Promise<CachedCustomer[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CUSTOMERS], 'readonly');
      const objectStore = transaction.objectStore(STORES.CUSTOMERS);
      const index = objectStore.index('user_id');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const customers = request.result as CachedCustomer[];
        // Filter out expired cache entries
        const validCustomers = customers.filter(
          (c) => Date.now() - c._cachedAt < CACHE_EXPIRY_MS
        );
        resolve(validCustomers);
      };
      request.onerror = () => reject(new Error('Failed to retrieve cached customers'));
    });
  }

  async setCustomer(customer: CachedCustomer): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CUSTOMERS], 'readwrite');
      const objectStore = transaction.objectStore(STORES.CUSTOMERS);

      const request = objectStore.put({
        ...customer,
        _cachedAt: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache customer'));
    });
  }

  async deleteCustomer(customerId: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CUSTOMERS], 'readwrite');
      const objectStore = transaction.objectStore(STORES.CUSTOMERS);
      const request = objectStore.delete(customerId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete cached customer'));
    });
  }

  // Transaction methods
  async setTransactions(userId: string, transactions: CachedTransaction[]): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS], 'readwrite');
      const objectStore = transaction.objectStore(STORES.TRANSACTIONS);
      const timestamp = Date.now();

      let completed = 0;
      const total = transactions.length;

      if (total === 0) {
        resolve();
        return;
      }

      transactions.forEach((tx) => {
        const request = objectStore.put({
          ...tx,
          _cachedAt: timestamp,
        });

        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(new Error('Failed to cache transaction'));
      });
    });
  }

  async getTransactions(): Promise<CachedTransaction[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
      const objectStore = transaction.objectStore(STORES.TRANSACTIONS);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const transactions = request.result as CachedTransaction[];
        // Filter out expired cache entries
        const validTransactions = transactions.filter(
          (t) => Date.now() - t._cachedAt < CACHE_EXPIRY_MS
        );
        // Sort by date descending
        validTransactions.sort((a, b) =>
          new Date(b.transaction_date || 0).getTime() - new Date(a.transaction_date || 0).getTime()
        );
        resolve(validTransactions);
      };
      request.onerror = () => reject(new Error('Failed to retrieve cached transactions'));
    });
  }

  async setTransaction(transaction: CachedTransaction): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TRANSACTIONS], 'readwrite');
      const objectStore = tx.objectStore(STORES.TRANSACTIONS);

      const request = objectStore.put({
        ...transaction,
        _cachedAt: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache transaction'));
    });
  }

  // Sync queue methods
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | '_addedAt'>): Promise<string> {
    const db = await this.ensureDb();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const objectStore = transaction.objectStore(STORES.SYNC_QUEUE);

      const queueItem: SyncQueueItem = {
        ...item,
        id,
        _addedAt: Date.now(),
      };

      const request = objectStore.put(queueItem);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('Failed to add to sync queue'));
    });
  }

  async getSyncQueue(status?: 'pending' | 'syncing' | 'completed' | 'failed'): Promise<SyncQueueItem[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const objectStore = transaction.objectStore(STORES.SYNC_QUEUE);

      let request: IDBRequest;
      if (status) {
        const index = objectStore.index('status');
        request = index.getAll(status);
      } else {
        request = objectStore.getAll();
      }

      request.onsuccess = () => {
        const items = request.result as SyncQueueItem[];
        // Sort by added time ascending (oldest first)
        items.sort((a, b) => a._addedAt - b._addedAt);
        resolve(items);
      };
      request.onerror = () => reject(new Error('Failed to retrieve sync queue'));
    });
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const objectStore = transaction.objectStore(STORES.SYNC_QUEUE);
      const getRequest = objectStore.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result as SyncQueueItem | undefined;
        if (!item) {
          reject(new Error('Sync queue item not found'));
          return;
        }

        const updatedItem = { ...item, ...updates };
        const putRequest = objectStore.put(updatedItem);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error('Failed to update sync queue item'));
      };
      getRequest.onerror = () => reject(new Error('Failed to retrieve sync queue item'));
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const objectStore = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove sync queue item'));
    });
  }

  async getPendingSyncCount(): Promise<number> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const objectStore = transaction.objectStore(STORES.SYNC_QUEUE);
      const index = objectStore.index('status');
      const request = index.count('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to count pending sync items'));
    });
  }

  // Clear all cached data
  async clear(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [STORES.CACHE, STORES.CUSTOMERS, STORES.TRANSACTIONS, STORES.SYNC_QUEUE],
        'readwrite'
      );

      let completed = 0;
      const stores = [STORES.CACHE, STORES.CUSTOMERS, STORES.TRANSACTIONS, STORES.SYNC_QUEUE];

      stores.forEach((storeName) => {
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.clear();

        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) resolve();
        };
        request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
      });
    });
  }

  // Clear only sync queue (after successful sync)
  async clearSyncQueue(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const objectStore = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear sync queue'));
    });
  }
}

export const offlineCache = new OfflineCache();
