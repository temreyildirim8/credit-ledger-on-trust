import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customersService } from './customers.service';
import { supabase } from '@/lib/supabase/client';

// Type the mocked supabase
const mockSupabase = vi.mocked(supabase);

describe('customersService', () => {
  const mockUserId = 'user-123';
  const mockCustomerId = 'customer-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCustomers', () => {
    it('should return empty array when no customers exist', async () => {
      // Chain: from('customer_balances').select('*').eq('user_id', userId).order('created_at', ...)
      const mockOrder = vi.fn().mockResolvedValue({ data: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await customersService.getCustomers(mockUserId);

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith('customer_balances');
    });

    it('should return customers with correct mapping', async () => {
      const mockData = [
        {
          id: '1',
          user_id: mockUserId,
          name: 'John Doe',
          phone: '+1234567890',
          balance: 100.50,
          transaction_count: 5,
          last_transaction_date: '2024-01-15',
          is_deleted: false,
          created_at: '2024-01-01',
        },
        {
          id: '2',
          user_id: mockUserId,
          name: 'Jane Smith',
          phone: null,
          balance: 0,
          transaction_count: 0,
          last_transaction_date: null,
          is_deleted: false,
          created_at: '2024-01-02',
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await customersService.getCustomers(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        user_id: mockUserId,
        name: 'John Doe',
        phone: '+1234567890',
        balance: 100.50,
        transaction_count: 5,
        last_transaction_date: '2024-01-15',
        is_deleted: false,
        created_at: '2024-01-01',
      });
      expect(result[1].balance).toBe(0);
      expect(result[1].phone).toBeNull();
    });

    it('should default balance to 0 when null', async () => {
      const mockData = [
        {
          id: '1',
          user_id: mockUserId,
          name: 'Test User',
          phone: null,
          balance: null,
          transaction_count: null,
          last_transaction_date: null,
          is_deleted: false,
          created_at: '2024-01-01',
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockData });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await customersService.getCustomers(mockUserId);

      expect(result[0].balance).toBe(0);
    });
  });

  describe('getCustomerById', () => {
    it('should return null when customer not found', async () => {
      // Chain: from('customer_balances').select('*').eq('user_id', userId).eq('id', customerId).single()
      const mockSingle = vi.fn().mockResolvedValue({ data: null });
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await customersService.getCustomerById(mockUserId, mockCustomerId);

      expect(result).toBeNull();
    });

    it('should return customer when found', async () => {
      const mockData = {
        id: mockCustomerId,
        user_id: mockUserId,
        name: 'John Doe',
        phone: '+1234567890',
        balance: 250.75,
        transaction_count: 10,
        last_transaction_date: '2024-02-01',
        is_deleted: false,
        created_at: '2024-01-01',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockData });
      const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await customersService.getCustomerById(mockUserId, mockCustomerId);

      expect(result).toEqual({
        id: mockCustomerId,
        user_id: mockUserId,
        name: 'John Doe',
        phone: '+1234567890',
        balance: 250.75,
        transaction_count: 10,
        last_transaction_date: '2024-02-01',
        is_deleted: false,
        created_at: '2024-01-01',
      });
    });
  });

  describe('createCustomer', () => {
    it('should create customer with required fields', async () => {
      const mockCustomer = {
        id: 'new-customer-id',
        user_id: mockUserId,
        name: 'New Customer',
        phone: null,
        address: null,
        notes: null,
        created_at: '2024-01-01',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockCustomer, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: mockInsert });

      const result = await customersService.createCustomer(mockUserId, {
        name: 'New Customer',
      });

      expect(result.name).toBe('New Customer');
      expect(result.balance).toBe(0);
    });

    it('should create customer with all fields', async () => {
      const mockCustomer = {
        id: 'new-customer-id',
        user_id: mockUserId,
        name: 'Full Customer',
        phone: '+1234567890',
        address: '123 Main St',
        notes: 'VIP customer',
        created_at: '2024-01-01',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockCustomer, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: mockInsert });

      const result = await customersService.createCustomer(mockUserId, {
        name: 'Full Customer',
        phone: '+1234567890',
        address: '123 Main St',
        notes: 'VIP customer',
      });

      expect(result.name).toBe('Full Customer');
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Database error');
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = vi.fn().mockReturnValue({ insert: mockInsert });

      await expect(
        customersService.createCustomer(mockUserId, { name: 'Test' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const mockUpdated = {
        id: mockCustomerId,
        name: 'Updated Name',
        phone: '+9999999999',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockUpdated, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = vi.fn().mockReturnValue({ update: mockUpdate });

      const result = await customersService.updateCustomer(mockCustomerId, {
        name: 'Updated Name',
        phone: '+9999999999',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = vi.fn().mockReturnValue({ update: mockUpdate });

      await expect(
        customersService.updateCustomer(mockCustomerId, { name: 'Test' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getCustomerTransactions', () => {
    it('should return empty array when no transactions', async () => {
      // Chain: from('transactions').select('*').eq('user_id', userId).eq('customer_id', customerId).order(...)
      const mockOrder = vi.fn().mockResolvedValue({ data: null });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await customersService.getCustomerTransactions(mockUserId, mockCustomerId);

      expect(result).toEqual([]);
    });

    it('should return transactions for customer', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          customer_id: mockCustomerId,
          type: 'debt',
          amount: 100,
          description: 'Test debt',
          transaction_date: '2024-01-15',
          created_at: '2024-01-15',
        },
        {
          id: 'tx-2',
          customer_id: mockCustomerId,
          type: 'payment',
          amount: 50,
          description: 'Test payment',
          transaction_date: '2024-01-16',
          created_at: '2024-01-16',
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockTransactions });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockSupabase.from = vi.fn().mockReturnValue({ select: mockSelect });

      const result = await customersService.getCustomerTransactions(mockUserId, mockCustomerId);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('debt');
      expect(result[1].type).toBe('payment');
    });
  });

  describe('archiveCustomer', () => {
    it('should archive customer successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = vi.fn().mockReturnValue({ update: mockUpdate });

      await expect(
        customersService.archiveCustomer(mockCustomerId)
      ).resolves.toBeUndefined();
    });

    it('should throw error when archive fails', async () => {
      const mockError = new Error('Archive failed');
      const mockEq = vi.fn().mockResolvedValue({ error: mockError });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = vi.fn().mockReturnValue({ update: mockUpdate });

      await expect(
        customersService.archiveCustomer(mockCustomerId)
      ).rejects.toThrow('Archive failed');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer and their transactions', async () => {
      // Mock transaction deletion
      const mockTxDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockTxDelete = vi.fn().mockReturnValue({ eq: mockTxDeleteEq });
      // Mock customer deletion
      const mockCustDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockCustDelete = vi.fn().mockReturnValue({ eq: mockCustDeleteEq });

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ delete: mockTxDelete })
        .mockReturnValueOnce({ delete: mockCustDelete });

      await expect(
        customersService.deleteCustomer(mockCustomerId)
      ).resolves.toBeUndefined();
    });

    it('should throw error when transaction deletion fails', async () => {
      const mockError = new Error('Transaction delete failed');
      const mockTxDeleteEq = vi.fn().mockResolvedValue({ error: mockError });
      const mockTxDelete = vi.fn().mockReturnValue({ eq: mockTxDeleteEq });

      mockSupabase.from = vi.fn().mockReturnValue({ delete: mockTxDelete });

      await expect(
        customersService.deleteCustomer(mockCustomerId)
      ).rejects.toThrow('Transaction delete failed');
    });

    it('should throw error when customer deletion fails', async () => {
      const mockError = new Error('Customer delete failed');
      const mockTxDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockTxDelete = vi.fn().mockReturnValue({ eq: mockTxDeleteEq });
      const mockCustDeleteEq = vi.fn().mockResolvedValue({ error: mockError });
      const mockCustDelete = vi.fn().mockReturnValue({ eq: mockCustDeleteEq });

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ delete: mockTxDelete })
        .mockReturnValueOnce({ delete: mockCustDelete });

      await expect(
        customersService.deleteCustomer(mockCustomerId)
      ).rejects.toThrow('Customer delete failed');
    });
  });
});
