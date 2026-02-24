import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCustomers } from './useCustomers';
import { customersService, Customer } from '@/lib/services/customers.service';
import { offlineCache } from '@/lib/pwa/offline-cache';
import type { User, Session } from '@supabase/supabase-js';

// Mock the useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the customers service
vi.mock('@/lib/services/customers.service', () => ({
  customersService: {
    getCustomers: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    archiveCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
    getCustomerTransactions: vi.fn(),
  },
}));

// Mock the offline cache
vi.mock('@/lib/pwa/offline-cache', () => ({
  offlineCache: {
    init: vi.fn(),
    getCustomers: vi.fn(),
    setCustomers: vi.fn(),
    setCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
    addToSyncQueue: vi.fn(),
  },
}));

// Import the mocked useAuth
import { useAuth } from './useAuth';

const mockUserId = 'user-123';

const mockCustomer: Customer = {
  id: 'customer-1',
  user_id: mockUserId,
  name: 'John Doe',
  phone: '+1234567890',
  address: '123 Main St',
  notes: 'VIP customer',
  balance: 100.5,
  transaction_count: 5,
  last_transaction_date: '2024-01-15',
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
};

// Create mock user and session with minimal required properties
const createMockUser = (id: string): User => ({
  id,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  role: 'authenticated',
  updated_at: '2024-01-01T00:00:00Z',
});

const createMockSession = (): Session => ({
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600,
  token_type: 'bearer',
  user: createMockUser(mockUserId),
});

describe('useCustomers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: online
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    });
    // Mock useAuth to return a user
    vi.mocked(useAuth).mockReturnValue({
      user: createMockUser(mockUserId),
      session: createMockSession(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    // Mock offline cache init
    vi.mocked(offlineCache.init).mockResolvedValue(undefined);
    vi.mocked(offlineCache.getCustomers).mockResolvedValue([]);
    vi.mocked(offlineCache.setCustomers).mockResolvedValue(undefined);
    vi.mocked(offlineCache.setCustomer).mockResolvedValue(undefined);
    vi.mocked(offlineCache.deleteCustomer).mockResolvedValue(undefined);
    vi.mocked(offlineCache.addToSyncQueue).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should have initial loading state as true', () => {
      vi.mocked(customersService.getCustomers).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useCustomers());

      expect(result.current.loading).toBe(true);
      expect(result.current.customers).toEqual([]);
    });

    it('should load customers on mount', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([mockCustomer]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0].name).toBe('John Doe');
    });

    it('should not load customers when user is null', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });

      const { result } = renderHook(() => useCustomers());

      // Wait a bit to ensure no loading happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(customersService.getCustomers).not.toHaveBeenCalled();
      expect(result.current.customers).toEqual([]);
    });

    it('should set isOffline to true when navigator is offline on init', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
      });
      vi.mocked(offlineCache.getCustomers).mockResolvedValue([
        {
          ...mockCustomer,
          _cachedAt: Date.now(),
        },
      ]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isOffline).toBe(true);
      expect(offlineCache.getCustomers).toHaveBeenCalled();
    });
  });

  describe('online mode', () => {
    it('should fetch customers from service when online', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([mockCustomer]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(customersService.getCustomers).toHaveBeenCalledWith(mockUserId);
      expect(result.current.customers).toHaveLength(1);
    });

    it('should cache customers after fetching', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([mockCustomer]);

      renderHook(() => useCustomers());

      await waitFor(() => {
        expect(offlineCache.setCustomers).toHaveBeenCalled();
      });

      expect(offlineCache.setCustomers).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([
          expect.objectContaining({ id: 'customer-1', _cachedAt: expect.any(Number) }),
        ])
      );
    });

    it('should handle fetch error gracefully', async () => {
      vi.mocked(customersService.getCustomers).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customers).toEqual([]);
    });

    it('should fallback to cache on network error', async () => {
      vi.mocked(customersService.getCustomers).mockRejectedValue(
        new Error('Network error')
      );
      vi.mocked(offlineCache.getCustomers).mockResolvedValue([
        {
          ...mockCustomer,
          _cachedAt: Date.now(),
        },
      ]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.customers).toHaveLength(1);
      });
    });
  });

  describe('createCustomer', () => {
    it('should create customer online and update state', async () => {
      const newCustomer: Customer = {
        ...mockCustomer,
        id: 'customer-2',
        name: 'Jane Doe',
      };
      vi.mocked(customersService.getCustomers).mockResolvedValue([]);
      vi.mocked(customersService.createCustomer).mockResolvedValue(newCustomer);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createCustomer({
          name: 'Jane Doe',
          phone: '+0987654321',
        });
      });

      expect(customersService.createCustomer).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ name: 'Jane Doe' })
      );
      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0].name).toBe('Jane Doe');
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

      const { result } = renderHook(() => useCustomers());

      await expect(
        result.current.createCustomer({ name: 'Test' })
      ).rejects.toThrow('User not authenticated');
    });

    it('should create optimistic customer when offline', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
      });
      vi.mocked(customersService.getCustomers).mockResolvedValue([]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createCustomer({
          name: 'Offline Customer',
          phone: '+1111111111',
        });
      });

      // Should have optimistic customer with temp ID
      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0].id).toMatch(/^temp_/);
      expect(result.current.customers[0].name).toBe('Offline Customer');

      // Should have queued for sync
      expect(offlineCache.addToSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          action_type: 'create_customer',
          status: 'pending',
        })
      );
    });

    it('should cache new customer after creation', async () => {
      const newCustomer: Customer = {
        ...mockCustomer,
        id: 'customer-2',
        name: 'Jane Doe',
      };
      vi.mocked(customersService.getCustomers).mockResolvedValue([]);
      vi.mocked(customersService.createCustomer).mockResolvedValue(newCustomer);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createCustomer({
          name: 'Jane Doe',
        });
      });

      expect(offlineCache.setCustomer).toHaveBeenCalled();
    });
  });

  describe('archiveCustomer', () => {
    it('should archive customer online and remove from state', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([mockCustomer]);
      vi.mocked(customersService.archiveCustomer).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.customers).toHaveLength(1);
      });

      await act(async () => {
        await result.current.archiveCustomer('customer-1');
      });

      expect(customersService.archiveCustomer).toHaveBeenCalledWith('customer-1');
      expect(result.current.customers).toHaveLength(0);
      expect(offlineCache.deleteCustomer).toHaveBeenCalledWith('customer-1');
    });

    it('should revert on archive error', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([mockCustomer]);
      vi.mocked(customersService.archiveCustomer).mockRejectedValue(
        new Error('Archive failed')
      );

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.customers).toHaveLength(1);
      });

      await expect(
        result.current.archiveCustomer('customer-1')
      ).rejects.toThrow('Archive failed');

      // Should reload customers on error
      expect(customersService.getCustomers).toHaveBeenCalledTimes(2);
    });

    it('should queue for sync when offline', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
      });
      vi.mocked(offlineCache.getCustomers).mockResolvedValue([
        { ...mockCustomer, _cachedAt: Date.now() },
      ]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.archiveCustomer('customer-1');
      });

      expect(offlineCache.addToSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          action_type: 'update_customer',
          payload: {
            customerId: 'customer-1',
            updates: { is_deleted: true },
          },
        })
      );
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer online and remove from state', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([mockCustomer]);
      vi.mocked(customersService.deleteCustomer).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.customers).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteCustomer('customer-1');
      });

      expect(customersService.deleteCustomer).toHaveBeenCalledWith('customer-1');
      expect(result.current.customers).toHaveLength(0);
      expect(offlineCache.deleteCustomer).toHaveBeenCalledWith('customer-1');
    });

    it('should revert on delete error', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([mockCustomer]);
      vi.mocked(customersService.deleteCustomer).mockRejectedValue(
        new Error('Delete failed')
      );

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.customers).toHaveLength(1);
      });

      await expect(
        result.current.deleteCustomer('customer-1')
      ).rejects.toThrow('Delete failed');

      // Should reload customers on error
      expect(customersService.getCustomers).toHaveBeenCalledTimes(2);
    });

    it('should queue for sync when offline', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        writable: true,
      });
      vi.mocked(offlineCache.getCustomers).mockResolvedValue([
        { ...mockCustomer, _cachedAt: Date.now() },
      ]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteCustomer('customer-1');
      });

      expect(offlineCache.addToSyncQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          action_type: 'delete_customer',
        })
      );
    });
  });

  describe('refreshCustomers', () => {
    it('should reload customers when called', async () => {
      vi.mocked(customersService.getCustomers)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockCustomer]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customers).toHaveLength(0);

      await act(async () => {
        result.current.refreshCustomers();
      });

      await waitFor(() => {
        expect(result.current.customers).toHaveLength(1);
      });
    });
  });

  describe('online/offline events', () => {
    it('should update isOffline when going offline', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isOffline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOffline).toBe(true);
    });

    it('should refresh customers when coming back online', async () => {
      vi.mocked(customersService.getCustomers)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockCustomer]);

      const { result } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(customersService.getCustomers).toHaveBeenCalledTimes(1);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(customersService.getCustomers).toHaveBeenCalledTimes(2);
      });

      expect(result.current.isOffline).toBe(false);
    });

    it('should clean up event listeners on unmount', async () => {
      vi.mocked(customersService.getCustomers).mockResolvedValue([]);

      const { unmount } = renderHook(() => useCustomers());

      await waitFor(() => {
        expect(customersService.getCustomers).toHaveBeenCalled();
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
});
