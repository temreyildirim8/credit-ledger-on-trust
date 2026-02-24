'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { customersService, Customer } from '@/lib/services/customers.service';
import { offlineCache, CachedCustomer } from '@/lib/pwa/offline-cache';

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Convert CachedCustomer to Customer format
  const cachedToCustomer = (cached: CachedCustomer): Customer => ({
    id: cached.id,
    user_id: cached.user_id,
    name: cached.name,
    phone: cached.phone,
    address: cached.address,
    notes: cached.notes,
    balance: cached.balance,
    transaction_count: cached.transaction_count,
    last_transaction_date: cached.last_transaction_date,
    is_deleted: cached.is_deleted,
    created_at: cached.created_at,
  });

  // Convert Customer to CachedCustomer format
  const customerToCached = (customer: Customer, userId: string): CachedCustomer => ({
    ...customer,
    user_id: userId,
    _cachedAt: Date.now(),
  });

  const loadCustomers = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Initialize offline cache
      await offlineCache.init();

      if (navigator.onLine) {
        // Online: fetch from network and cache
        const data = await customersService.getCustomers(user.id);
        setCustomers(data);

        // Cache customers for offline use
        await offlineCache.setCustomers(
          user.id,
          data.map((c) => customerToCached(c, user.id))
        );
      } else {
        // Offline: load from cache
        const cachedCustomers = await offlineCache.getCustomers(user.id);
        setCustomers(cachedCustomers.map(cachedToCustomer));
        setIsOffline(true);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      // On network error, try loading from cache
      try {
        const cachedCustomers = await offlineCache.getCustomers(user.id);
        if (cachedCustomers.length > 0) {
          setCustomers(cachedCustomers.map(cachedToCustomer));
        }
      } catch {
        // Ignore cache errors
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      loadCustomers(); // Refresh when back online
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadCustomers]);

  const createCustomer = async (customer: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }): Promise<Customer> => {
    if (!user?.id) throw new Error('User not authenticated');

    if (navigator.onLine) {
      // Online: create directly
      const newCustomer = await customersService.createCustomer(user.id, customer);
      setCustomers([newCustomer, ...customers]);

      // Cache the new customer
      await offlineCache.setCustomer(customerToCached(newCustomer, user.id));

      return newCustomer;
    } else {
      // Offline: queue for sync and return optimistic customer
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const optimisticCustomer: Customer = {
        id: tempId,
        user_id: user.id,
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

      // Add to local state optimistically
      setCustomers([optimisticCustomer, ...customers]);

      // Queue for background sync
      await offlineCache.addToSyncQueue({
        action_type: 'create_customer',
        payload: {
          userId: user.id,
          customer,
          tempId,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending',
      });

      // Cache optimistically
      await offlineCache.setCustomer(customerToCached(optimisticCustomer, user.id));

      return optimisticCustomer;
    }
  };

  const refreshCustomers = useCallback(() => {
    loadCustomers();
  }, [loadCustomers]);

  const archiveCustomer = async (customerId: string) => {
    if (!user?.id) return;

    // Optimistic update
    setCustomers(customers.filter((c) => c.id !== customerId));

    if (navigator.onLine) {
      try {
        await customersService.archiveCustomer(customerId);
        await offlineCache.deleteCustomer(customerId);
      } catch (error) {
        console.error('Error archiving customer:', error);
        // Revert on error
        loadCustomers();
        throw error;
      }
    } else {
      // Queue for sync
      await offlineCache.addToSyncQueue({
        action_type: 'update_customer',
        payload: {
          customerId,
          updates: { is_deleted: true },
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending',
      });
      await offlineCache.deleteCustomer(customerId);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!user?.id) return;

    // Optimistic update
    setCustomers(customers.filter((c) => c.id !== customerId));

    if (navigator.onLine) {
      try {
        await customersService.deleteCustomer(customerId);
        await offlineCache.deleteCustomer(customerId);
      } catch (error) {
        console.error('Error deleting customer:', error);
        // Revert on error
        loadCustomers();
        throw error;
      }
    } else {
      // Queue for sync
      await offlineCache.addToSyncQueue({
        action_type: 'delete_customer',
        payload: {
          customerId,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending',
      });
      await offlineCache.deleteCustomer(customerId);
    }
  };

  return {
    customers,
    loading,
    isOffline,
    createCustomer,
    refreshCustomers,
    archiveCustomer,
    deleteCustomer,
  };
}
