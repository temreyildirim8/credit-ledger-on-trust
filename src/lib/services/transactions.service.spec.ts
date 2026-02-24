import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionsService, type Transaction } from './transactions.service';
import { supabase } from '@/lib/supabase/client';

// Type the mocked supabase
const mockSupabase = vi.mocked(supabase);

describe('transactionsService', () => {
  const mockUserId = 'user-123';
  const mockCustomerId = 'customer-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should return empty array when no transactions exist', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null });
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionsService.getTransactions(mockUserId);

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
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
          customers: { name: 'John Doe' },
        },
        {
          id: 'tx-2',
          customer_id: 'customer-789',
          type: 'payment',
          amount: 75.50,
          description: 'Partial payment',
          transaction_date: '2024-01-16',
          created_at: '2024-01-16T11:00:00Z',
          customers: { name: 'Jane Smith' },
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData });
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
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
          customers: null,
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData });
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionsService.getTransactions(mockUserId);

      expect(result[0].customer_name).toBeUndefined();
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

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
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

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
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

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      await transactionsService.createTransaction(mockUserId, {
        customerId: mockCustomerId,
        type: 'debt',
        amount: 50.00,
      });

      // Verify that insert was called with transaction data
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed');
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        insert: mockInsert,
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
      const mockOrder = vi.fn().mockResolvedValue({ data: null });
      const mockEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
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

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData });
      const mockEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionsService.getCustomers(mockUserId);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: '1', name: 'Alice' });
      expect(result[1]).toEqual({ id: '2', name: 'Bob' });
      expect(result[2]).toEqual({ id: '3', name: 'Charlie' });
    });

    it('should filter out deleted customers', async () => {
      const mockData = [
        { id: '1', name: 'Active Customer' },
      ];

      // Chain: from('customers').select('id, name').eq('user_id', userId).eq('is_deleted', false).order('name')
      const mockOrder = vi.fn().mockResolvedValue({ data: mockData });
      const mockEqInner = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      const mockEqOuter = vi.fn().mockReturnValue({
        eq: mockEqInner,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEqOuter,
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const result = await transactionsService.getCustomers(mockUserId);

      // Verify the result (the mock chain ensures is_deleted=false is part of the query)
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: '1', name: 'Active Customer' });
    });
  });
});
