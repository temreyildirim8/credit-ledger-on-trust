"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { customersService, Customer } from "@/lib/services/customers.service";
import { offlineCache, CachedCustomer } from "@/lib/pwa/offline-cache";

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  // Track if we're currently loading to prevent duplicate calls
  const isLoadingRef = useRef(false);
  // Track the last load time to debounce focus events
  const lastLoadTimeRef = useRef(0);

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
  const customerToCached = (
    customer: Customer,
    userId: string,
  ): CachedCustomer => ({
    ...customer,
    user_id: userId,
    _cachedAt: Date.now(),
  });

  const loadCustomers = useCallback(
    async (force = false) => {
      // Prevent duplicate concurrent loads
      if (isLoadingRef.current && !force) return;

      if (!user?.id) return;

      // Debounce: don't reload if we loaded in the last 500ms (unless forced)
      const now = Date.now();
      if (!force && now - lastLoadTimeRef.current < 5000) return;

      isLoadingRef.current = true;
      lastLoadTimeRef.current = now;
      setLoading(true);
      try {
        // Initialize offline cache
        await offlineCache.init();

        if (navigator.onLine) {
          // Online: fetch from network and cache
          // API route validates JWT server-side, no need to pass userId
          const data = await customersService.getCustomers();
          setCustomers(data);

          // Cache customers for offline use
          await offlineCache.setCustomers(
            user.id,
            data.map((c) => customerToCached(c, user.id)),
          );
        } else {
          // Offline: load from cache
          const cachedCustomers = await offlineCache.getCustomers(user.id);
          setCustomers(cachedCustomers.map(cachedToCustomer));
          setIsOffline(true);
        }
      } catch (error) {
        console.error("Error loading customers:", error);
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
        isLoadingRef.current = false;
      }
    },
    [user?.id],
  );

  // Initial load when user changes
  useEffect(() => {
    if (user?.id) {
      loadCustomers(true);
    }
  }, [user?.id, loadCustomers]);

  // Listen for online/offline events - use a ref to avoid re-registering
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Small delay to ensure network is ready
      setTimeout(() => loadCustomers(true), 100);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadCustomers]);

  // Refresh customers when the window gains focus - with 5s debounce
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && navigator.onLine) {
        loadCustomers();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id, loadCustomers]);

  const createCustomer = async (customer: {
    national_id?: string;
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }): Promise<Customer> => {
    if (!user?.id) throw new Error("User not authenticated");

    if (navigator.onLine) {
      // Online: create directly
      const newCustomer = await customersService.createCustomer(
        user.id,
        customer,
      );
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
        national_id: customer.national_id || null,
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
        action_type: "create_customer",
        payload: {
          userId: user.id,
          customer,
          tempId,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: "pending",
      });

      // Cache optimistically
      await offlineCache.setCustomer(
        customerToCached(optimisticCustomer, user.id),
      );

      return optimisticCustomer;
    }
  };

  const refreshCustomers = useCallback(() => {
    loadCustomers(true);
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
        console.error("Error archiving customer:", error);
        // Revert on error
        loadCustomers();
        throw error;
      }
    } else {
      // Queue for sync
      await offlineCache.addToSyncQueue({
        action_type: "update_customer",
        payload: {
          customerId,
          updates: { is_deleted: true },
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: "pending",
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
        console.error("Error deleting customer:", error);
        // Revert on error
        loadCustomers();
        throw error;
      }
    } else {
      // Queue for sync
      await offlineCache.addToSyncQueue({
        action_type: "delete_customer",
        payload: {
          customerId,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: "pending",
      });
      await offlineCache.deleteCustomer(customerId);
    }
  };

  const updateCustomer = async (
    customerId: string,
    updates: {
      name?: string;
      phone?: string;
      address?: string;
      notes?: string;
    },
  ): Promise<Customer> => {
    if (!user?.id) throw new Error("User not authenticated");

    // Find the current customer to get existing values
    const currentCustomer = customers.find((c) => c.id === customerId);
    if (!currentCustomer) throw new Error("Customer not found");

    // Optimistic update
    const optimisticCustomer: Customer = {
      ...currentCustomer,
      name: updates.name ?? currentCustomer.name,
      phone: updates.phone ?? currentCustomer.phone,
      address: updates.address ?? currentCustomer.address,
      notes: updates.notes ?? currentCustomer.notes,
    };

    setCustomers(
      customers.map((c) => (c.id === customerId ? optimisticCustomer : c)),
    );

    if (navigator.onLine) {
      try {
        await customersService.updateCustomer(customerId, {
          name: updates.name,
          phone: updates.phone || null,
          address: updates.address || null,
          notes: updates.notes || null,
        });

        // Update cache
        await offlineCache.setCustomer(
          customerToCached(optimisticCustomer, user.id),
        );

        return optimisticCustomer;
      } catch (error) {
        console.error("Error updating customer:", error);
        // Revert on error
        loadCustomers();
        throw error;
      }
    } else {
      // Queue for sync
      await offlineCache.addToSyncQueue({
        action_type: "update_customer",
        payload: {
          customerId,
          updates,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: "pending",
      });

      // Update cache
      await offlineCache.setCustomer(
        customerToCached(optimisticCustomer, user.id),
      );

      return optimisticCustomer;
    }
  };

  return {
    customers,
    loading,
    isOffline,
    createCustomer,
    updateCustomer,
    refreshCustomers,
    archiveCustomer,
    deleteCustomer,
  };
}
