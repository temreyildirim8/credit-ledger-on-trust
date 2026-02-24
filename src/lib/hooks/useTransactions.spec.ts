import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTransactions } from './useTransactions';
import { transactionsService, Transaction } from '@/lib/services/transactions.service';
import { offlineCache } from '@/lib/pwa/offline-cache';

// Mock the useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the transactions service
vi.mock('@/lib/services/transactions.service', () => ({
  transactionsService: {
    getTransactions: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

// Mock the offline cache
vi.mock('@/lib/pwa/offline-cache', () => ({
  offlineCache: {
    init: vi.fn(),
    getTransactions: vi.fn(),
    setTransactions: vi.fn(),
    setTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    addToSyncQueue: vi.fn(),
  },
}));

// Import the mocked useAuth
import { useAuth } from './useAuth';

const mockUserId = 'user-123';
const mockCustomerId = 'customer-1';

const mockTransaction: Transaction = {
  id: 'tx-1',
  customer_id: mockCustomerId,
  type: 'debt',
  amount: 100.5,
  description: 'Test transaction',
  transaction_date: '2024-01-15T00:00:00Z',
  created_at: '2024-01-15T00:00:00Z',
  customer_name: 'John Doe',
  note: null,
};

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });
    // Mock useAuth to return a user
    vi.mocked(useAuth).mockReturnValue({
      user: { id: mockUserId } as any,
      session: {} as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    // Mock offline cache init
    vi.mocked(offlineCache.init).mockResolvedValue(undefined);
    vi.mocked(offlineCache.getTransactions).mockResolvedValue([]);
    vi.mocked(offlineCache.setTransactions).mockResolvedValue(undefined);
    vi.mocked(offlineCache.setTransaction).mockResolvedValue(undefined);
    vi.mocked(offlineCache.deleteTransaction).mockResolvedValue(undefined);
    vi.mocked(offlineCache.addToSyncQueue).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should have initial loading state as true', () => {
      vi.mocked(transactionsService.getTransactions).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useTransactions());

      expect(result.current.loading).toBe(true);
      expect(result.current.transactions).toEqual([]);
    });

    it('should load transactions on mount', async () => {
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0].type).toBe('debt');
      expect(result.current.transactions[0].amount).toBe(100.5);
    });

    it('should not load transactions when user is null', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      const { result } = renderHook(() => useTransactions());

      // Wait a bit to ensure no loading happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(transactionsService.getTransactions).not.toHaveBeenCalled();
      expect(result.current.transactions).toEqual([]);
    });

    it('should set isOffline to true when navigator is offline on init', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
      });
      vi.mocked(offlineCache.getTransactions).mockResolvedValue([
        {
          ...mockTransaction,
          _cachedAt: Date.now(),
        },
      ]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isOffline).toBe(true);
      expect(offlineCache.getTransactions).toHaveBeenCalled();
    });
  });

  describe('online mode', () => {
    it('should fetch transactions from service when online', async () => {
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(transactionsService.getTransactions).toHaveBeenCalledWith(mockUserId);
      expect(result.current.transactions).toHaveLength(1);
    });

    it('should cache transactions after fetching', async () => {
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([
        mockTransaction,
      ]);

      renderHook(() => useTransactions());

      await waitFor(() => {
        expect(offlineCache.setTransactions).toHaveBeenCalled();
      });

      expect(offlineCache.setTransactions).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([
          expect.objectContaining({ id: 'tx-1', _cachedAt: expect.any(Number) }),
        ])
      );
    });

    it('should handle fetch error gracefully', async () => {
      vi.mocked(transactionsService.getTransactions).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toEqual([]);
    });

    it('should fallback to cache on network error', async () => {
      vi.mocked(transactionsService.getTransactions).mockRejectedValue(
        new Error('Network error')
      );
      vi.mocked(offlineCache.getTransactions).mockResolvedValue([
        {
          ...mockTransaction,
          _cachedAt: Date.now(),
        },
      ]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(1);
      });
    });

    it('should handle multiple transaction types', async () => {
      const mockTransactions: Transaction[] = [
        { ...mockTransaction, id: 'tx-1', type: 'debt', amount: 100 },
        { ...mockTransaction, id: 'tx-2', type: 'payment', amount: 50 },
        { ...mockTransaction, id: 'tx-3', type: 'debt', amount: 75 },
      ];
      vi.mocked(transactionsService.getTransactions).mockResolvedValue(
        mockTransactions
      );

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(3);
      });

      const debts = result.current.transactions.filter((t) => t.type === 'debt');
      const payments = result.current.transactions.filter(
        (t) => t.type === 'payment'
      );

      expect(debts).toHaveLength(2);
      expect(payments).toHaveLength(1);
    });
  });

  describe('createTransaction', () => {
    it('should create transaction online and update state', async () => {
      const newTransaction: Transaction = {
        ...mockTransaction,
        id: 'tx-2',
        type: 'payment',
        amount: 50,
      };
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([]);
      vi.mocked(transactionsService.createTransaction).mockResolvedValue(
        newTransaction
      );

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createTransaction({
          customerId: mockCustomerId,
          type: 'payment',
          amount: 50,
          note: 'Payment received',
        });
      });

      expect(transactionsService.createTransaction).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          customerId: mockCustomerId,
          type: 'payment',
          amount: 50,
        })
      );
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0].type).toBe('payment');
    });

    it('should throw error when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      const { result } = renderHook(() => useTransactions());

      await expect(
        result.current.createTransaction({
          customerId: mockCustomerId,
          type: 'debt',
          amount: 100,
        })
      ).rejects.toThrow('User not authenticated');
    });

    it('should create optimistic transaction when offline', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
      });
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createTransaction({
          customerId: mockCustomerId,
          type: 'debt',
          amount: 250,
          note: 'Offline transaction',
        });
      });

      // Should have optimistic transaction with temp ID
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0].id).toMatch(/^temp_/);
      expect(result.current.transactions[0].type).toBe('debt');
      expect(result.current.transactions[0].amount).toBe(250);

      // Should have queued for sync
      expect(offlineCache.addToSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          action_type: 'create_transaction',
          status: 'pending',
        })
      );
    });

    it('should cache new transaction after creation', async () => {
      const newTransaction: Transaction = {
        ...mockTransaction,
        id: 'tx-2',
      };
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([]);
      vi.mocked(transactionsService.createTransaction).mockResolvedValue(
        newTransaction
      );

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createTransaction({
          customerId: mockCustomerId,
          type: 'debt',
          amount: 100,
        });
      });

      expect(offlineCache.setTransaction).toHaveBeenCalled();
    });

    it('should support both debt and payment types', async () => {
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([]);

      const debtTransaction: Transaction = {
        ...mockTransaction,
        id: 'tx-debt',
        type: 'debt',
      };
      const paymentTransaction: Transaction = {
        ...mockTransaction,
        id: 'tx-payment',
        type: 'payment',
      };

      vi.mocked(transactionsService.createTransaction)
        .mockResolvedValueOnce(debtTransaction)
        .mockResolvedValueOnce(paymentTransaction);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create debt
      await act(async () => {
        await result.current.createTransaction({
          customerId: mockCustomerId,
          type: 'debt',
          amount: 100,
        });
      });

      // Create payment
      await act(async () => {
        await result.current.createTransaction({
          customerId: mockCustomerId,
          type: 'payment',
          amount: 50,
        });
      });

      expect(result.current.transactions).toHaveLength(2);
      expect(result.current.transactions[0].type).toBe('payment'); // Most recent first
      expect(result.current.transactions[1].type).toBe('debt');
    });
  });

  describe('refreshTransactions', () => {
    it('should reload transactions when called', async () => {
      vi.mocked(transactionsService.getTransactions)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockTransaction]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(0);

      await act(async () => {
        result.current.refreshTransactions();
      });

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(1);
      });
    });

    it('should show loading state during refresh', async () => {
      vi.mocked(transactionsService.getTransactions).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useTransactions());

      // Initial load completes
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup second call with delayed response
      vi.mocked(transactionsService.getTransactions).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve([mockTransaction]), 50);
          })
      );

      act(() => {
        result.current.refreshTransactions();
      });

      // During refresh, loading should be true
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Complete the refresh
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.transactions).toHaveLength(1);
    });
  });

  describe('online/offline events', () => {
    it('should update isOffline when going offline', async () => {
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isOffline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOffline).toBe(true);
    });

    it('should refresh transactions when coming back online', async () => {
      vi.mocked(transactionsService.getTransactions)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockTransaction]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(transactionsService.getTransactions).toHaveBeenCalledTimes(1);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(transactionsService.getTransactions).toHaveBeenCalledTimes(2);
      });

      expect(result.current.isOffline).toBe(false);
    });

    it('should clean up event listeners on unmount', async () => {
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([]);

      const { unmount } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(transactionsService.getTransactions).toHaveBeenCalled();
      });

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      unmount();

      // Check that removeEventListener was called for both events
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('transaction conversions', () => {
    it('should correctly convert cached transaction to transaction', async () => {
      const cachedTransaction = {
        ...mockTransaction,
        _cachedAt: Date.now(),
        customer_name: 'Test Customer',
      };

      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
      });
      vi.mocked(offlineCache.getTransactions).mockResolvedValue([
        cachedTransaction,
      ]);

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.transactions).toHaveLength(1);
      });

      const transaction = result.current.transactions[0];
      expect(transaction.id).toBe('tx-1');
      expect(transaction.customer_name).toBe('Test Customer');
      expect(transaction.note).toBeNull(); // Note is set to null in conversion
    });
  });

  describe('large amounts', () => {
    it('should handle large transaction amounts (millions in IDR)', async () => {
      const largeAmountTransaction: Transaction = {
        ...mockTransaction,
        id: 'tx-large',
        amount: 15000000, // 15 million IDR
      };
      vi.mocked(transactionsService.getTransactions).mockResolvedValue([]);
      vi.mocked(transactionsService.createTransaction).mockResolvedValue(
        largeAmountTransaction
      );

      const { result } = renderHook(() => useTransactions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createTransaction({
          customerId: mockCustomerId,
          type: 'debt',
          amount: 15000000,
        });
      });

      expect(result.current.transactions[0].amount).toBe(15000000);
    });
  });
});
