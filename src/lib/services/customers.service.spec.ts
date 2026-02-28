import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { customersService } from './customers.service';

describe('customersService', () => {
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

  describe('getCustomers', () => {
    it('should return empty array when no customers exist', async () => {
      // Mock fetch response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ customers: [], totalCount: 0 }),
      });

      const result = await customersService.getCustomers();

      expect(result.customers).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith('/api/customers', expect.any(Object));
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ customers: mockData, totalCount: 2 }),
      });

      const result = await customersService.getCustomers();

      expect(result.customers).toHaveLength(2);
      expect(result.customers[0]).toEqual({
        id: '1',
        user_id: mockUserId,
        national_id: null,
        name: 'John Doe',
        phone: '+1234567890',
        address: undefined,
        notes: undefined,
        balance: 100.50,
        transaction_count: 5,
        last_transaction_date: '2024-01-15',
        is_deleted: false,
        created_at: '2024-01-01',
      });
      expect(result.customers[1].balance).toBe(0);
      expect(result.customers[1].phone).toBeNull();
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ customers: mockData, totalCount: 1 }),
      });

      const result = await customersService.getCustomers();

      expect(result.customers[0].balance).toBe(0);
    });

    it('should throw error when unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(customersService.getCustomers()).rejects.toThrow('Unauthorized. Please sign in to continue.');
    });
  });

  describe('getCustomerById', () => {
    it('should return null when customer not found', async () => {
      // Mock fetch response with empty customers
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ customers: [], totalCount: 0 }),
      });

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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ customers: [mockData], totalCount: 1 }),
      });

      const result = await customersService.getCustomerById(mockUserId, mockCustomerId);

      expect(result).toEqual({
        id: mockCustomerId,
        user_id: mockUserId,
        national_id: null,
        name: 'John Doe',
        phone: '+1234567890',
        address: undefined,
        notes: undefined,
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
        national_id: null,
        created_at: '2024-01-01',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ customer: mockCustomer }),
      });

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
        national_id: null,
        created_at: '2024-01-01',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ customer: mockCustomer }),
      });

      const result = await customersService.createCustomer(mockUserId, {
        name: 'Full Customer',
        phone: '+1234567890',
        address: '123 Main St',
        notes: 'VIP customer',
      });

      expect(result.name).toBe('Full Customer');
    });

    it('should throw error when creation fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Database error' }),
      });

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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ customer: mockUpdated }),
      });

      const result = await customersService.updateCustomer(mockUserId, mockCustomerId, {
        name: 'Updated Name',
        phone: '+9999999999',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw error when update fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Update failed' }),
      });

      await expect(
        customersService.updateCustomer(mockUserId, mockCustomerId, { name: 'Test' })
      ).rejects.toThrow('Update failed');
    });

    it('should throw error when customer not found (IDOR protection)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(
        customersService.updateCustomer(mockUserId, mockCustomerId, { name: 'Test' })
      ).rejects.toThrow('Customer not found or access denied');
    });
  });

  describe('getCustomerTransactions', () => {
    it('should throw error when request fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(
        customersService.getCustomerTransactions(mockUserId, mockCustomerId)
      ).rejects.toThrow('Server error');
    });

    it('should return empty array when no transactions', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transactions: [] }),
      });

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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transactions: mockTransactions }),
      });

      const result = await customersService.getCustomerTransactions(mockUserId, mockCustomerId);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('debt');
      expect(result[1].type).toBe('payment');
    });
  });

  describe('archiveCustomer', () => {
    it('should archive customer successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await expect(
        customersService.archiveCustomer(mockUserId, mockCustomerId)
      ).resolves.toBeUndefined();
    });

    it('should throw error when archive fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Archive failed' }),
      });

      await expect(
        customersService.archiveCustomer(mockUserId, mockCustomerId)
      ).rejects.toThrow('Archive failed');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer and their transactions', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await expect(
        customersService.deleteCustomer(mockUserId, mockCustomerId)
      ).resolves.toBeUndefined();
    });

    it('should throw error when customer not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(
        customersService.deleteCustomer(mockUserId, mockCustomerId)
      ).rejects.toThrow('Customer not found or access denied');
    });

    it('should throw error when deletion fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Delete failed' }),
      });

      await expect(
        customersService.deleteCustomer(mockUserId, mockCustomerId)
      ).rejects.toThrow('Delete failed');
    });
  });
});
