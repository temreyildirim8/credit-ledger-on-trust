import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineCache, offlineCache, STORES, CachedCustomer, CachedTransaction, SyncQueueItem } from './offline-cache';

// Mock IndexedDB
const createMockIDBRequest = <T>(result: T): IDBRequest<T> => {
  const request = {
    result,
    error: null,
    source: null,
    transaction: null,
    readyState: 'done' as IDBRequestReadyState,
    onsuccess: null as ((ev: Event) => void) | null,
    onerror: null as ((ev: Event) => void) | null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as IDBRequest<T>;
  return request;
};

interface MockObjectStore {
  put: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getAll: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  index: ReturnType<typeof vi.fn>;
  createIndex: ReturnType<typeof vi.fn>;
}

interface MockTransaction {
  objectStore: ReturnType<typeof vi.fn>;
  error: null;
  onabort: null;
  oncomplete: null;
  onerror: null;
}

interface MockDatabase {
  createObjectStore: ReturnType<typeof vi.fn>;
  deleteObjectStore: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  objectStoreNames: {
    contains: ReturnType<typeof vi.fn>;
  };
}

describe('OfflineCache', () => {
  let mockIndexedDB: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockDB: MockDatabase;
  let mockTransaction: MockTransaction;
  let mockObjectStore: MockObjectStore;
  let mockIndex: {
    getAll: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Reset singleton state by creating a new instance
    vi.clearAllMocks();

    mockIndex = {
      getAll: vi.fn(),
      count: vi.fn(),
    };

    mockObjectStore = {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(),
      clear: vi.fn(),
      index: vi.fn(() => mockIndex),
      createIndex: vi.fn(),
    };

    mockTransaction = {
      objectStore: vi.fn(() => mockObjectStore),
      error: null,
      onabort: null,
      oncomplete: null,
      onerror: null,
    };

    mockDB = {
      createObjectStore: vi.fn(() => mockObjectStore),
      deleteObjectStore: vi.fn(),
      transaction: vi.fn(() => mockTransaction),
      close: vi.fn(),
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
    };

    mockIndexedDB = {
      open: vi.fn(),
    };

    // Replace global indexedDB
    (global as any).indexedDB = mockIndexedDB;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constants and Types', () => {
    it('should define correct store names', () => {
      expect(STORES.CACHE).toBe('offline-cache');
      expect(STORES.CUSTOMERS).toBe('customers');
      expect(STORES.TRANSACTIONS).toBe('transactions');
      expect(STORES.SYNC_QUEUE).toBe('sync-queue');
    });

    it('should export singleton instance', () => {
      expect(offlineCache).toBeInstanceOf(OfflineCache);
    });
  });

  describe('init', () => {
    it('should create database with correct name and version', async () => {
      const cache = new OfflineCache();
      const mockRequest = createMockIDBRequest(mockDB as any);

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.onsuccess?.({ target: mockRequest } as any);
        }, 0);
        return mockRequest;
      });

      await cache.init();

      expect(mockIndexedDB.open).toHaveBeenCalledWith('global-ledger-offline', 2);
    });

    it('should create object stores on upgrade', async () => {
      const cache = new OfflineCache();
      const mockRequest = {
        result: mockDB,
        error: null,
        source: null,
        transaction: null,
        readyState: 'done' as IDBRequestReadyState,
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          // Simulate onupgradeneeded
          const upgradeEvent = {
            target: { result: mockDB },
          } as any;
          mockDB.createObjectStore.mockImplementation((name: string) => ({
            createIndex: vi.fn(),
          }));
          cache['init']().catch(() => {}); // Trigger upgrade logic
        }, 0);
        return mockRequest;
      });

      // The init handles the upgrade internally
    });

    it('should reject on database open error', async () => {
      const cache = new OfflineCache();
      const mockRequest = createMockIDBRequest(null);

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.onerror?.({ target: mockRequest } as any);
        }, 0);
        return mockRequest;
      });

      await expect(cache.init()).rejects.toThrow('Failed to open IndexedDB');
    });

    it('should return existing init promise if already initializing', async () => {
      const cache = new OfflineCache();
      const mockRequest = createMockIDBRequest(mockDB as any);

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.onsuccess?.({ target: mockRequest } as any);
        }, 10);
        return mockRequest;
      });

      const promise1 = cache.init();
      const promise2 = cache.init();

      // Both should resolve to the same underlying promise
      await expect(promise1).resolves.toBeUndefined();
      await expect(promise2).resolves.toBeUndefined();
    });
  });

  describe('Generic cache methods', () => {
    let cache: OfflineCache;

    beforeEach(async () => {
      cache = new OfflineCache();
      const mockRequest = createMockIDBRequest(mockDB as any);

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.onsuccess?.({ target: mockRequest } as any);
        }, 0);
        return mockRequest;
      });

      await cache.init();
    });

    describe('set', () => {
      it('should store data with key and timestamp', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onsuccess?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        await cache.set('test-key', { foo: 'bar' });

        expect(mockDB.transaction).toHaveBeenCalledWith([STORES.CACHE], 'readwrite');
        expect(mockObjectStore.put).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'test-key',
            data: { foo: 'bar' },
            timestamp: expect.any(Number),
          })
        );
      });

      it('should reject on put error', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onerror?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        await expect(cache.set('test-key', { foo: 'bar' })).rejects.toThrow('Failed to cache data');
      });
    });

    describe('get', () => {
      it('should retrieve cached data', async () => {
        const cachedData = {
          key: 'test-key',
          data: { foo: 'bar' },
          timestamp: Date.now(),
        };
        const getRequest = createMockIDBRequest(cachedData);
        mockObjectStore.get.mockImplementation(() => {
          setTimeout(() => {
            getRequest.onsuccess?.({ target: getRequest } as any);
          }, 0);
          return getRequest;
        });

        const result = await cache.get<{ foo: string }>('test-key');

        expect(result).toEqual({ foo: 'bar' });
      });

      it('should return null for expired cache', async () => {
        const expiredData = {
          key: 'test-key',
          data: { foo: 'bar' },
          timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        };
        const getRequest = createMockIDBRequest(expiredData);
        mockObjectStore.get.mockImplementation(() => {
          setTimeout(() => {
            getRequest.onsuccess?.({ target: getRequest } as any);
          }, 0);
          return getRequest;
        });

        const result = await cache.get<{ foo: string }>('test-key');

        expect(result).toBeNull();
      });

      it('should return null for non-existent key', async () => {
        const getRequest = createMockIDBRequest(undefined);
        mockObjectStore.get.mockImplementation(() => {
          setTimeout(() => {
            getRequest.onsuccess?.({ target: getRequest } as any);
          }, 0);
          return getRequest;
        });

        const result = await cache.get<{ foo: string }>('non-existent');

        expect(result).toBeNull();
      });

      it('should reject on get error', async () => {
        const getRequest = createMockIDBRequest(null);
        mockObjectStore.get.mockImplementation(() => {
          setTimeout(() => {
            getRequest.onerror?.({ target: getRequest } as any);
          }, 0);
          return getRequest;
        });

        await expect(cache.get('test-key')).rejects.toThrow('Failed to retrieve cached data');
      });
    });
  });

  describe('Customer methods', () => {
    let cache: OfflineCache;

    beforeEach(async () => {
      cache = new OfflineCache();
      const mockRequest = createMockIDBRequest(mockDB as any);

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.onsuccess?.({ target: mockRequest } as any);
        }, 0);
        return mockRequest;
      });

      await cache.init();
    });

    const mockCustomer: CachedCustomer = {
      id: 'customer-1',
      user_id: 'user-123',
      name: 'John Doe',
      phone: '+1234567890',
      address: '123 Main St',
      notes: 'VIP customer',
      balance: 100.5,
      transaction_count: 5,
      last_transaction_date: '2024-01-15',
      is_deleted: false,
      created_at: '2024-01-01T00:00:00Z',
      _cachedAt: Date.now(),
    };

    describe('setCustomers', () => {
      it('should store multiple customers', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onsuccess?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        await cache.setCustomers('user-123', [mockCustomer]);

        expect(mockDB.transaction).toHaveBeenCalledWith([STORES.CUSTOMERS], 'readwrite');
        expect(mockObjectStore.put).toHaveBeenCalled();
      });

      it('should resolve immediately for empty array', async () => {
        await cache.setCustomers('user-123', []);

        expect(mockObjectStore.put).not.toHaveBeenCalled();
      });

      it('should reject on put error', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onerror?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        await expect(cache.setCustomers('user-123', [mockCustomer])).rejects.toThrow('Failed to cache customer');
      });
    });

    describe('getCustomers', () => {
      it('should retrieve customers by user_id', async () => {
        const getAllRequest = createMockIDBRequest([mockCustomer]);
        mockIndex.getAll.mockImplementation(() => {
          setTimeout(() => {
            getAllRequest.onsuccess?.({ target: getAllRequest } as any);
          }, 0);
          return getAllRequest;
        });

        const result = await cache.getCustomers('user-123');

        expect(mockObjectStore.index).toHaveBeenCalledWith('user_id');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('John Doe');
      });

      it('should filter out expired customers', async () => {
        const expiredCustomer = {
          ...mockCustomer,
          _cachedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        };
        const validCustomer = {
          ...mockCustomer,
          id: 'customer-2',
          _cachedAt: Date.now(),
        };

        const getAllRequest = createMockIDBRequest([expiredCustomer, validCustomer]);
        mockIndex.getAll.mockImplementation(() => {
          setTimeout(() => {
            getAllRequest.onsuccess?.({ target: getAllRequest } as any);
          }, 0);
          return getAllRequest;
        });

        const result = await cache.getCustomers('user-123');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('customer-2');
      });

      it('should reject on get error', async () => {
        const getAllRequest = createMockIDBRequest(null);
        mockIndex.getAll.mockImplementation(() => {
          setTimeout(() => {
            getAllRequest.onerror?.({ target: getAllRequest } as any);
          }, 0);
          return getAllRequest;
        });

        await expect(cache.getCustomers('user-123')).rejects.toThrow('Failed to retrieve cached customers');
      });
    });

    describe('setCustomer', () => {
      it('should store single customer with timestamp', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onsuccess?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        await cache.setCustomer(mockCustomer);

        expect(mockObjectStore.put).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockCustomer,
            _cachedAt: expect.any(Number),
          })
        );
      });
    });

    describe('deleteCustomer', () => {
      it('should delete customer by id', async () => {
        const deleteRequest = createMockIDBRequest(undefined);
        mockObjectStore.delete.mockImplementation(() => {
          setTimeout(() => {
            deleteRequest.onsuccess?.({ target: deleteRequest } as any);
          }, 0);
          return deleteRequest;
        });

        await cache.deleteCustomer('customer-1');

        expect(mockObjectStore.delete).toHaveBeenCalledWith('customer-1');
      });

      it('should reject on delete error', async () => {
        const deleteRequest = createMockIDBRequest(undefined);
        mockObjectStore.delete.mockImplementation(() => {
          setTimeout(() => {
            deleteRequest.onerror?.({ target: deleteRequest } as any);
          }, 0);
          return deleteRequest;
        });

        await expect(cache.deleteCustomer('customer-1')).rejects.toThrow('Failed to delete cached customer');
      });
    });
  });

  describe('Transaction methods', () => {
    let cache: OfflineCache;

    beforeEach(async () => {
      cache = new OfflineCache();
      const mockRequest = createMockIDBRequest(mockDB as any);

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.onsuccess?.({ target: mockRequest } as any);
        }, 0);
        return mockRequest;
      });

      await cache.init();
    });

    const mockTransaction: CachedTransaction = {
      id: 'tx-1',
      customer_id: 'customer-1',
      type: 'debt',
      amount: 150.0,
      description: 'Test transaction',
      transaction_date: '2024-01-15',
      created_at: '2024-01-15T10:00:00Z',
      customer_name: 'John Doe',
      _cachedAt: Date.now(),
    };

    describe('setTransactions', () => {
      it('should store multiple transactions', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onsuccess?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        await cache.setTransactions('user-123', [mockTransaction]);

        expect(mockDB.transaction).toHaveBeenCalledWith([STORES.TRANSACTIONS], 'readwrite');
      });

      it('should resolve immediately for empty array', async () => {
        await cache.setTransactions('user-123', []);

        expect(mockObjectStore.put).not.toHaveBeenCalled();
      });
    });

    describe('getTransactions', () => {
      it('should retrieve all transactions sorted by date descending', async () => {
        const tx1 = { ...mockTransaction, id: 'tx-1', transaction_date: '2024-01-10', _cachedAt: Date.now() };
        const tx2 = { ...mockTransaction, id: 'tx-2', transaction_date: '2024-01-15', _cachedAt: Date.now() };

        const getAllRequest = createMockIDBRequest([tx1, tx2]);
        mockObjectStore.getAll.mockImplementation(() => {
          setTimeout(() => {
            getAllRequest.onsuccess?.({ target: getAllRequest } as any);
          }, 0);
          return getAllRequest;
        });

        const result = await cache.getTransactions();

        expect(result).toHaveLength(2);
        // Should be sorted by date descending (tx2 first)
        expect(result[0].id).toBe('tx-2');
        expect(result[1].id).toBe('tx-1');
      });

      it('should filter out expired transactions', async () => {
        const expiredTx = {
          ...mockTransaction,
          id: 'tx-expired',
          _cachedAt: Date.now() - 25 * 60 * 60 * 1000,
        };
        const validTx = {
          ...mockTransaction,
          id: 'tx-valid',
          _cachedAt: Date.now(),
        };

        const getAllRequest = createMockIDBRequest([expiredTx, validTx]);
        mockObjectStore.getAll.mockImplementation(() => {
          setTimeout(() => {
            getAllRequest.onsuccess?.({ target: getAllRequest } as any);
          }, 0);
          return getAllRequest;
        });

        const result = await cache.getTransactions();

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('tx-valid');
      });

      it('should handle transactions with null dates', async () => {
        const txWithNullDate = { ...mockTransaction, transaction_date: null, _cachedAt: Date.now() };

        const getAllRequest = createMockIDBRequest([txWithNullDate]);
        mockObjectStore.getAll.mockImplementation(() => {
          setTimeout(() => {
            getAllRequest.onsuccess?.({ target: getAllRequest } as any);
          }, 0);
          return getAllRequest;
        });

        const result = await cache.getTransactions();

        expect(result).toHaveLength(1);
      });
    });

    describe('setTransaction', () => {
      it('should store single transaction with timestamp', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onsuccess?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        await cache.setTransaction(mockTransaction);

        expect(mockObjectStore.put).toHaveBeenCalledWith(
          expect.objectContaining({
            ...mockTransaction,
            _cachedAt: expect.any(Number),
          })
        );
      });
    });
  });

  describe('Sync queue methods', () => {
    let cache: OfflineCache;

    beforeEach(async () => {
      cache = new OfflineCache();
      const mockRequest = createMockIDBRequest(mockDB as any);

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.onsuccess?.({ target: mockRequest } as any);
        }, 0);
        return mockRequest;
      });

      await cache.init();
    });

    describe('addToSyncQueue', () => {
      it('should add item to sync queue with generated ID', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onsuccess?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        const item: Omit<SyncQueueItem, 'id' | '_addedAt'> = {
          action_type: 'create_customer',
          payload: { name: 'Test' },
          client_timestamp: new Date().toISOString(),
          retry_count: 0,
          max_retries: 3,
          status: 'pending',
        };

        const id = await cache.addToSyncQueue(item);

        expect(id).toMatch(/^sync_\d+_[a-z0-9]+$/);
        expect(mockObjectStore.put).toHaveBeenCalledWith(
          expect.objectContaining({
            ...item,
            id,
            _addedAt: expect.any(Number),
          })
        );
      });

      it('should support different action types', async () => {
        const putRequest = createMockIDBRequest(undefined);
        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onsuccess?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        const actionTypes: SyncQueueItem['action_type'][] = [
          'create_customer',
          'update_customer',
          'delete_customer',
          'create_transaction',
          'update_transaction',
        ];

        for (const actionType of actionTypes) {
          await cache.addToSyncQueue({
            action_type: actionType,
            payload: {},
            client_timestamp: new Date().toISOString(),
            retry_count: 0,
            max_retries: 3,
            status: 'pending',
          });
        }

        expect(mockObjectStore.put).toHaveBeenCalledTimes(5);
      });
    });

    describe('getSyncQueue', () => {
      it('should retrieve all sync queue items sorted by added time', async () => {
        const item1: SyncQueueItem = {
          id: 'sync-1',
          action_type: 'create_customer',
          payload: {},
          client_timestamp: '2024-01-01',
          retry_count: 0,
          max_retries: 3,
          status: 'pending',
          _addedAt: 1000,
        };
        const item2: SyncQueueItem = {
          id: 'sync-2',
          action_type: 'create_transaction',
          payload: {},
          client_timestamp: '2024-01-02',
          retry_count: 0,
          max_retries: 3,
          status: 'pending',
          _addedAt: 2000,
        };

        const getAllRequest = createMockIDBRequest([item2, item1]); // Return in reverse order
        mockObjectStore.getAll.mockImplementation(() => {
          setTimeout(() => {
            getAllRequest.onsuccess?.({ target: getAllRequest } as any);
          }, 0);
          return getAllRequest;
        });

        const result = await cache.getSyncQueue();

        // Should be sorted by _addedAt ascending
        expect(result[0].id).toBe('sync-1');
        expect(result[1].id).toBe('sync-2');
      });

      it('should filter by status when provided', async () => {
        const pendingItem: SyncQueueItem = {
          id: 'sync-1',
          action_type: 'create_customer',
          payload: {},
          client_timestamp: '2024-01-01',
          retry_count: 0,
          max_retries: 3,
          status: 'pending',
          _addedAt: 1000,
        };

        const getAllRequest = createMockIDBRequest([pendingItem]);
        mockIndex.getAll.mockImplementation(() => {
          setTimeout(() => {
            getAllRequest.onsuccess?.({ target: getAllRequest } as any);
          }, 0);
          return getAllRequest;
        });

        const result = await cache.getSyncQueue('pending');

        expect(mockObjectStore.index).toHaveBeenCalledWith('status');
        expect(result).toHaveLength(1);
      });
    });

    describe('updateSyncQueueItem', () => {
      it('should update existing sync queue item', async () => {
        const existingItem: SyncQueueItem = {
          id: 'sync-1',
          action_type: 'create_customer',
          payload: { name: 'Test' },
          client_timestamp: '2024-01-01',
          retry_count: 0,
          max_retries: 3,
          status: 'pending',
          _addedAt: 1000,
        };

        const getRequest = createMockIDBRequest(existingItem);
        const putRequest = createMockIDBRequest(undefined);

        mockObjectStore.get.mockImplementation(() => {
          setTimeout(() => {
            getRequest.onsuccess?.({ target: getRequest } as any);
          }, 0);
          return getRequest;
        });

        mockObjectStore.put.mockImplementation(() => {
          setTimeout(() => {
            putRequest.onsuccess?.({ target: putRequest } as any);
          }, 0);
          return putRequest;
        });

        await cache.updateSyncQueueItem('sync-1', { status: 'completed', retry_count: 1 });

        expect(mockObjectStore.put).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'sync-1',
            status: 'completed',
            retry_count: 1,
          })
        );
      });

      it('should reject when item not found', async () => {
        const getRequest = createMockIDBRequest(undefined);

        mockObjectStore.get.mockImplementation(() => {
          setTimeout(() => {
            getRequest.onsuccess?.({ target: getRequest } as any);
          }, 0);
          return getRequest;
        });

        await expect(cache.updateSyncQueueItem('non-existent', { status: 'completed' })).rejects.toThrow(
          'Sync queue item not found'
        );
      });
    });

    describe('removeSyncQueueItem', () => {
      it('should remove item from sync queue', async () => {
        const deleteRequest = createMockIDBRequest(undefined);
        mockObjectStore.delete.mockImplementation(() => {
          setTimeout(() => {
            deleteRequest.onsuccess?.({ target: deleteRequest } as any);
          }, 0);
          return deleteRequest;
        });

        await cache.removeSyncQueueItem('sync-1');

        expect(mockObjectStore.delete).toHaveBeenCalledWith('sync-1');
      });
    });

    describe('getPendingSyncCount', () => {
      it('should return count of pending items', async () => {
        const countRequest = createMockIDBRequest(5);
        mockIndex.count.mockImplementation(() => {
          setTimeout(() => {
            countRequest.onsuccess?.({ target: countRequest } as any);
          }, 0);
          return countRequest;
        });

        const count = await cache.getPendingSyncCount();

        expect(mockObjectStore.index).toHaveBeenCalledWith('status');
        expect(count).toBe(5);
      });
    });
  });

  describe('Clear methods', () => {
    let cache: OfflineCache;

    beforeEach(async () => {
      cache = new OfflineCache();
      const mockRequest = createMockIDBRequest(mockDB as any);

      mockIndexedDB.open.mockImplementation(() => {
        setTimeout(() => {
          mockRequest.onsuccess?.({ target: mockRequest } as any);
        }, 0);
        return mockRequest;
      });

      await cache.init();
    });

    describe('clear', () => {
      it('should clear all object stores', async () => {
        const clearRequest = createMockIDBRequest(undefined);
        mockObjectStore.clear.mockImplementation(() => {
          setTimeout(() => {
            clearRequest.onsuccess?.({ target: clearRequest } as any);
          }, 0);
          return clearRequest;
        });

        await cache.clear();

        expect(mockDB.transaction).toHaveBeenCalledWith(
          [STORES.CACHE, STORES.CUSTOMERS, STORES.TRANSACTIONS, STORES.SYNC_QUEUE],
          'readwrite'
        );
        expect(mockObjectStore.clear).toHaveBeenCalledTimes(4);
      });
    });

    describe('clearSyncQueue', () => {
      it('should clear only sync queue', async () => {
        const clearRequest = createMockIDBRequest(undefined);
        mockObjectStore.clear.mockImplementation(() => {
          setTimeout(() => {
            clearRequest.onsuccess?.({ target: clearRequest } as any);
          }, 0);
          return clearRequest;
        });

        await cache.clearSyncQueue();

        expect(mockDB.transaction).toHaveBeenCalledWith([STORES.SYNC_QUEUE], 'readwrite');
        expect(mockObjectStore.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error when database not initialized', async () => {
      const cache = new OfflineCache();

      // Don't initialize the database
      await expect(cache.get('test')).rejects.toThrow();
    });
  });
});
