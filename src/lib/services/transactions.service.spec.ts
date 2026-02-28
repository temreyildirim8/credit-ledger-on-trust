import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transactionsService } from './transactions.service';

describe('transactionsService', () => {
  const mockUserId = 'user-123';
  const mockCustomerId = 'customer-456';

  // Store original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getTransactions', () => {
    it('should return empty array when no transactions exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transactions: [] }),
      });

      const result = await transactionsService.getTransactions(mockUserId);

      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith('/api/transactions', expect.any(Object));
    });

    it('should return transactions with customer names', async () => {
      const mockData = [
        {
          id: 'tx-1',
          customer_id: mockCustomerId,
          type: 'debt',
          amount: 150.00,
          description: 'Purchase on credit',
          transaction_date: '2024-01-15',
          created_at: '2024-01-15T10:00:00Z',
          customer_name: 'John Doe',
        },
        {
          id: 'tx-2',
          customer_id: 'customer-789',
          type: 'payment',
          amount: 75.50,
          description: 'Partial payment',
          transaction_date: '2024-01-16',
          created_at: '2024-01-16T11:00:00Z',
          customer_name: 'Jane Smith',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transactions: mockData }),
      });

      const result = await transactionsService.getTransactions(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tx-1',
        customer_id: mockCustomerId,
        type: 'debt',
        amount: 150.00,
        description: 'Purchase on credit',
        transaction_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        customer_name: 'John Doe',
      });
      expect(result[1].customer_name).toBe('Jane Smith');
    });

    it('should handle null customer name', async () => {
      const mockData = [
        {
          id: 'tx-1',
          customer_id: mockCustomerId,
          type: 'debt',
          amount: 100,
          description: 'Test',
          transaction_date: '2024-01-15',
          created_at: '2024-01-15',
          customer_name: null,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transactions: mockData }),
      });

      const result = await transactionsService.getTransactions(mockUserId);

      expect(result[0].customer_name).toBeNull();
    });
  });

  describe('createTransaction', () => {
    it('should create debt transaction successfully', async () => {
      const mockTransaction = {
        id: 'new-tx-id',
        customer_id: mockCustomerId,
        type: 'debt',
        amount: 200.00,
        description: 'New debt',
        transaction_date: '2024-01-17',
        created_at: '2024-01-17T12:00:00Z',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ transaction: mockTransaction }),
      });

      const result = await transactionsService.createTransaction(mockUserId, {
        customerId: mockCustomerId,
        type: 'debt',
        amount: 200.00,
        note: 'New debt',
        date: '2024-01-17',
      });

      expect(result.type).toBe('debt');
      expect(result.amount).toBe(200.00);
      expect(result.description).toBe('New debt');
    });

    it('should create payment transaction successfully', async () => {
      const mockTransaction = {
        id: 'new-tx-id',
        customer_id: mockCustomerId,
        type: 'payment',
        amount: 100.00,
        description: 'Payment received',
        transaction_date: '2024-01-17',
        created_at: '2024-01-17T12:00:00Z',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ transaction: mockTransaction }),
      });

      const result = await transactionsService.createTransaction(mockUserId, {
        customerId: mockCustomerId,
        type: 'payment',
        amount: 100.00,
      });

      expect(result.type).toBe('payment');
    });

    it('should use current date when date not provided', async () => {
      const mockTransaction = {
        id: 'new-tx-id',
        customer_id: mockCustomerId,
        type: 'debt',
        amount: 50.00,
        description: null,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ transaction: mockTransaction }),
      });

      await transactionsService.createTransaction(mockUserId, {
        customerId: mockCustomerId,
        type: 'debt',
        amount: 50.00,
      });

      // Verify that fetch was called
      expect(global.fetch).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should throw error when creation fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Creation failed' }),
      });

      await expect(
        transactionsService.createTransaction(mockUserId, {
          customerId: mockCustomerId,
          type: 'debt',
          amount: 100,
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('getCustomers', () => {
    it('should return empty array when no customers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ customers: [] }),
      });

      const result = await transactionsService.getCustomers(mockUserId);

      expect(result).toEqual([]);
    });

    it('should return customers ordered by name', async () => {
      const mockData = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ customers: mockData }),
      });

      const result = await transactionsService.getCustomers(mockUserId);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: '1', name: 'Alice' });
      expect(result[1]).toEqual({ id: '2', name: 'Bob' });
      expect(result[2]).toEqual({ id: '3', name: 'Charlie' });
    });

    it('should throw error when unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(
        transactionsService.getCustomers(mockUserId)
      ).rejects.toThrow('Unauthorized. Please sign in to continue.');
    });
  });
});
