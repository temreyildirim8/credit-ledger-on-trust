"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  transactionsService,
  Transaction,
} from "@/lib/services/transactions.service";
import { offlineCache, CachedTransaction } from "@/lib/pwa/offline-cache";
import { queryKeys } from "@/lib/query-keys";

// Helper functions for cache conversion
const cachedToTransaction = (cached: CachedTransaction): Transaction => ({
  id: cached.id,
  customer_id: cached.customer_id,
  type: cached.type,
  amount: cached.amount,
  description: cached.description,
  transaction_date: cached.transaction_date,
  created_at: cached.created_at,
  customer_name: cached.customer_name,
  note: null,
});

const transactionToCached = (tx: Transaction): CachedTransaction => ({
  ...tx,
  _cachedAt: Date.now(),
});

/**
 * Hook to manage transactions with React Query
 * - Automatic caching and background refetching
 * - Optimistic updates for mutations
 * - Offline support with IndexedDB fallback
 */
export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Query for fetching transactions
  const {
    data: transactions = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Transaction[]>({
    queryKey: queryKeys.transactions.lists(),
    queryFn: async () => {
      if (!user?.id) return [];

      // Initialize offline cache
      await offlineCache.init();

      if (navigator.onLine) {
        // Online: fetch from network
        const data = await transactionsService.getTransactions(user.id);

        // Cache for offline use
        await offlineCache.setTransactions(
          user.id,
          data.map(transactionToCached),
        );

        return data;
      } else {
        // Offline: load from cache
        const cachedTransactions = await offlineCache.getTransactions();
        return cachedTransactions.map(cachedToTransaction);
      }
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      // Don't retry if offline
      if (!navigator.onLine) return false;
      return failureCount < 2;
    },
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refetch when coming back online
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (transaction: {
      customerId: string;
      type: "debt" | "payment";
      amount: number;
      note?: string;
      date?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (navigator.onLine) {
        return transactionsService.createTransaction(user.id, transaction);
      } else {
        // Offline: create optimistic transaction
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const optimisticTransaction: Transaction = {
          id: tempId,
          customer_id: transaction.customerId,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.note || null,
          transaction_date: transaction.date || new Date().toISOString(),
          created_at: new Date().toISOString(),
          customer_name: undefined,
          note: transaction.note || null,
        };

        // Queue for sync
        await offlineCache.addToSyncQueue({
          action_type: "create_transaction",
          payload: {
            userId: user.id,
            transaction,
            tempId,
          },
          client_timestamp: new Date().toISOString(),
          retry_count: 0,
          max_retries: 3,
          status: "pending",
        });

        // Cache optimistically
        await offlineCache.setTransaction(
          transactionToCached(optimisticTransaction),
        );

        return optimisticTransaction;
      }
    },
    onMutate: async (newTransaction) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.lists(),
      });

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactions.lists(),
      );

      // Optimistically update
      if (previousTransactions) {
        const optimisticTransaction: Transaction = {
          id: `temp_${Date.now()}`,
          customer_id: newTransaction.customerId,
          type: newTransaction.type,
          amount: newTransaction.amount,
          description: newTransaction.note || null,
          transaction_date: newTransaction.date || new Date().toISOString(),
          created_at: new Date().toISOString(),
          customer_name: undefined,
          note: newTransaction.note || null,
        };
        queryClient.setQueryData<Transaction[]>(
          queryKeys.transactions.lists(),
          [optimisticTransaction, ...previousTransactions],
        );
      }

      return { previousTransactions };
    },
    onSuccess: () => {
      // Invalidate customer queries to refresh balances
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _newTransaction, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactions.lists(),
          context.previousTransactions,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists(),
      });
    },
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      transactionId,
      transaction,
    }: {
      transactionId: string;
      transaction: {
        customerId?: string;
        type?: "debt" | "payment";
        amount?: number;
        note?: string;
        date?: string;
      };
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (navigator.onLine) {
        const updateData: {
          customer_id?: string;
          type?: "debt" | "payment";
          amount?: number;
          description?: string | null;
          transaction_date?: string;
        } = {};

        if (transaction.customerId) updateData.customer_id = transaction.customerId;
        if (transaction.type) updateData.type = transaction.type;
        if (transaction.amount !== undefined) updateData.amount = transaction.amount;
        if (transaction.note !== undefined) updateData.description = transaction.note || null;
        if (transaction.date) updateData.transaction_date = transaction.date;

        return transactionsService.updateTransaction(transactionId, updateData);
      } else {
        // Offline: queue for sync
        await offlineCache.addToSyncQueue({
          action_type: "update_transaction",
          payload: {
            userId: user.id,
            transactionId,
            transaction,
          },
          client_timestamp: new Date().toISOString(),
          retry_count: 0,
          max_retries: 3,
          status: "pending",
        });

        const currentTransactions = queryClient.getQueryData<Transaction[]>(
          queryKeys.transactions.lists(),
        );
        const current = currentTransactions?.find((t) => t.id === transactionId);
        return {
          ...current,
          customer_id: transaction.customerId || current?.customer_id,
          type: transaction.type || current?.type,
          amount: transaction.amount ?? current?.amount,
          description: transaction.note ?? current?.description,
          transaction_date: transaction.date || current?.transaction_date,
        } as Transaction;
      }
    },
    onMutate: async ({ transactionId, transaction }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.lists(),
      });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactions.lists(),
      );

      // Optimistically update
      if (previousTransactions) {
        queryClient.setQueryData<Transaction[]>(
          queryKeys.transactions.lists(),
          previousTransactions.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  customer_id: transaction.customerId || t.customer_id,
                  type: transaction.type || t.type,
                  amount: transaction.amount ?? t.amount,
                  description: transaction.note ?? t.description,
                  transaction_date: transaction.date || t.transaction_date,
                }
              : t,
          ),
        );
      }

      return { previousTransactions };
    },
    onSuccess: () => {
      // Invalidate customer queries to refresh balances
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactions.lists(),
          context.previousTransactions,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists(),
      });
    },
  });

  // Refresh function
  const refreshTransactions = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    transactions,
    loading,
    isOffline,
    error,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: (
      transactionId: string,
      transaction: Parameters<typeof updateMutation.mutateAsync>[0]["transaction"],
    ) => updateMutation.mutateAsync({ transactionId, transaction }),
    refreshTransactions,
    // Additional React Query states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

// Re-export Transaction type
export type { Transaction };
