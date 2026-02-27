"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  customersService,
  Customer,
  GetCustomersResponse,
} from "@/lib/services/customers.service";
import { offlineCache, CachedCustomer } from "@/lib/pwa/offline-cache";
import { queryKeys } from "@/lib/query-keys";

// Helper functions for cache conversion
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

const customerToCached = (
  customer: Customer,
  userId: string,
): CachedCustomer => ({
  ...customer,
  user_id: userId,
  _cachedAt: Date.now(),
});

/**
 * Hook to manage customers with React Query
 * - Automatic caching and background refetching
 * - Optimistic updates for mutations
 * - Offline support with IndexedDB fallback
 * @param includeArchived - When true, includes archived customers in the list
 */
export function useCustomers(includeArchived = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Query for fetching customers
  const {
    data: response,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<GetCustomersResponse>({
    queryKey: [...queryKeys.customers.lists(), { includeArchived }],
    queryFn: async () => {
      // Initialize offline cache
      await offlineCache.init();

      if (navigator.onLine) {
        // Online: fetch from network
        const data = await customersService.getCustomers(includeArchived);

        // Cache for offline use (only cache active customers)
        if (user?.id && !includeArchived) {
          await offlineCache.setCustomers(
            user.id,
            data.customers.map((c) => customerToCached(c, user.id)),
          );
        }

        return data;
      } else {
        // Offline: load from cache
        if (user?.id) {
          const cachedCustomers = await offlineCache.getCustomers(user.id);
          const customers = cachedCustomers.map(cachedToCustomer);
          return {
            customers,
            totalCount: customers.length,
          };
        }
        return { customers: [], totalCount: 0 };
      }
    },
    enabled: !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      // Don't retry if offline
      if (!navigator.onLine) return false;
      return failureCount < 2;
    },
  });

  // Extract customers and total count from response
  const customers = response?.customers ?? [];
  const totalCount = response?.totalCount ?? customers.length;

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refetch when coming back online
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (customer: {
      national_id?: string;
      name: string;
      phone?: string;
      address?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (navigator.onLine) {
        return customersService.createCustomer(user.id, customer);
      } else {
        // Offline: create optimistic customer
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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

        // Queue for sync
        await offlineCache.addToSyncQueue({
          action_type: "create_customer",
          payload: { userId: user.id, customer, tempId },
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
    },
    onMutate: async (newCustomer) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<GetCustomersResponse>(
        queryKeys.customers.lists(),
      );

      // Optimistically update to the new value
      if (previousData && user?.id) {
        const optimisticCustomer: Customer = {
          id: `temp_${Date.now()}`,
          user_id: user.id,
          national_id: newCustomer.national_id || null,
          name: newCustomer.name,
          phone: newCustomer.phone || null,
          address: newCustomer.address || null,
          notes: newCustomer.notes || null,
          balance: 0,
          transaction_count: 0,
          last_transaction_date: null,
          is_deleted: false,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<GetCustomersResponse>(
          queryKeys.customers.lists(),
          {
            customers: [optimisticCustomer, ...previousData.customers],
            totalCount: previousData.totalCount + 1,
          },
        );
      }

      return { previousData };
    },
    onError: (_err, _newCustomer, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.customers.lists(),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      customerId,
      updates,
    }: {
      customerId: string;
      updates: {
        name?: string;
        phone?: string;
        address?: string;
        notes?: string;
      };
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (navigator.onLine) {
        await customersService.updateCustomer(user.id, customerId, {
          name: updates.name,
          phone: updates.phone || null,
          address: updates.address || null,
          notes: updates.notes || null,
        });

        // Return updated customer data
        const currentCustomers = queryClient.getQueryData<Customer[]>(
          queryKeys.customers.lists(),
        );
        const current = currentCustomers?.find((c) => c.id === customerId);
        return { ...current, ...updates } as Customer;
      } else {
        // Offline: queue for sync
        await offlineCache.addToSyncQueue({
          action_type: "update_customer",
          payload: { userId: user.id, customerId, updates },
          client_timestamp: new Date().toISOString(),
          retry_count: 0,
          max_retries: 3,
          status: "pending",
        });

        const currentData = queryClient.getQueryData<GetCustomersResponse>(
          queryKeys.customers.lists(),
        );
        const current = currentData?.customers.find((c) => c.id === customerId);
        return { ...current, ...updates } as Customer;
      }
    },
    onMutate: async ({ customerId, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });

      const previousData = queryClient.getQueryData<GetCustomersResponse>(
        queryKeys.customers.lists(),
      );

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<GetCustomersResponse>(
          queryKeys.customers.lists(),
          {
            customers: previousData.customers.map((c) =>
              c.id === customerId
                ? {
                    ...c,
                    name: updates.name ?? c.name,
                    phone: updates.phone ?? c.phone,
                    address: updates.address ?? c.address,
                    notes: updates.notes ?? c.notes,
                  }
                : c,
            ),
            totalCount: previousData.totalCount,
          },
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.customers.lists(),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });

  // Archive customer mutation (soft delete)
  const archiveMutation = useMutation({
    mutationFn: async (customerId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (navigator.onLine) {
        await customersService.archiveCustomer(user.id, customerId);
        await offlineCache.deleteCustomer(customerId);
      } else {
        await offlineCache.addToSyncQueue({
          action_type: "update_customer",
          payload: { userId: user.id, customerId, updates: { is_deleted: true } },
          client_timestamp: new Date().toISOString(),
          retry_count: 0,
          max_retries: 3,
          status: "pending",
        });
        await offlineCache.deleteCustomer(customerId);
      }
    },
    onMutate: async (customerId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });

      const previousData = queryClient.getQueryData<GetCustomersResponse>(
        queryKeys.customers.lists(),
      );

      if (previousData) {
        queryClient.setQueryData<GetCustomersResponse>(
          queryKeys.customers.lists(),
          {
            customers: previousData.customers.filter((c) => c.id !== customerId),
            totalCount: previousData.totalCount, // totalCount stays the same for archive
          },
        );
      }

      return { previousData };
    },
    onError: (_err, _customerId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.customers.lists(),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });

  // Delete customer mutation (hard delete)
  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (navigator.onLine) {
        await customersService.deleteCustomer(user.id, customerId);
        await offlineCache.deleteCustomer(customerId);
      } else {
        await offlineCache.addToSyncQueue({
          action_type: "delete_customer",
          payload: { userId: user.id, customerId },
          client_timestamp: new Date().toISOString(),
          retry_count: 0,
          max_retries: 3,
          status: "pending",
        });
        await offlineCache.deleteCustomer(customerId);
      }
    },
    onMutate: async (customerId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });

      const previousData = queryClient.getQueryData<GetCustomersResponse>(
        queryKeys.customers.lists(),
      );

      if (previousData) {
        queryClient.setQueryData<GetCustomersResponse>(
          queryKeys.customers.lists(),
          {
            customers: previousData.customers.filter((c) => c.id !== customerId),
            totalCount: previousData.totalCount - 1, // totalCount decreases for hard delete
          },
        );
      }

      return { previousData };
    },
    onError: (_err, _customerId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.customers.lists(),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });

  // Refresh function
  const refreshCustomers = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    customers,
    totalCount,
    loading,
    isOffline,
    error,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: (customerId: string, updates: Parameters<typeof updateMutation.mutateAsync>[0]["updates"]) =>
      updateMutation.mutateAsync({ customerId, updates }),
    refreshCustomers,
    archiveCustomer: archiveMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
    // Additional React Query states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Re-export Customer type
export type { Customer };
