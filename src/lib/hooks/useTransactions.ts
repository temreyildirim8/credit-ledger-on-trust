'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { transactionsService, Transaction } from '@/lib/services/transactions.service';
import { offlineCache, CachedTransaction } from '@/lib/pwa/offline-cache';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Convert CachedTransaction to Transaction format
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

  // Convert Transaction to CachedTransaction format
  const transactionToCached = (tx: Transaction): CachedTransaction => ({
    ...tx,
    _cachedAt: Date.now(),
  });

  const loadTransactions = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Initialize offline cache
      await offlineCache.init();

      if (navigator.onLine) {
        // Online: fetch from network and cache
        const data = await transactionsService.getTransactions(user.id);
        setTransactions(data);

        // Cache transactions for offline use
        await offlineCache.setTransactions(
          user.id,
          data.map(transactionToCached)
        );
      } else {
        // Offline: load from cache
        const cachedTransactions = await offlineCache.getTransactions();
        setTransactions(cachedTransactions.map(cachedToTransaction));
        setIsOffline(true);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // On network error, try loading from cache
      try {
        const cachedTransactions = await offlineCache.getTransactions();
        if (cachedTransactions.length > 0) {
          setTransactions(cachedTransactions.map(cachedToTransaction));
        }
      } catch {
        // Ignore cache errors
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      loadTransactions(); // Refresh when back online
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadTransactions]);

  // Refresh transactions when the window gains focus (e.g., navigating back from Quick Add)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && navigator.onLine) {
        loadTransactions();
      }
    };

    // Also refresh on visibility change (for mobile/tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id && navigator.onLine) {
        loadTransactions();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, loadTransactions]);

  const createTransaction = async (transaction: {
    customerId: string;
    type: 'debt' | 'payment';
    amount: number;
    note?: string;
    date?: string;
  }) => {
    if (!user?.id) throw new Error('User not authenticated');

    if (navigator.onLine) {
      // Online: create directly
      const newTransaction = await transactionsService.createTransaction(user.id, transaction);
      setTransactions([newTransaction, ...transactions]);

      // Cache the new transaction
      await offlineCache.setTransaction(transactionToCached(newTransaction));

      return newTransaction;
    } else {
      // Offline: queue for sync and return optimistic transaction
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

      // Add to local state optimistically
      setTransactions([optimisticTransaction, ...transactions]);

      // Queue for background sync
      await offlineCache.addToSyncQueue({
        action_type: 'create_transaction',
        payload: {
          userId: user.id,
          transaction,
          tempId,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending',
      });

      // Cache optimistically
      await offlineCache.setTransaction(transactionToCached(optimisticTransaction));

      return optimisticTransaction;
    }
  };

  const refreshTransactions = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  const updateTransaction = async (transactionId: string, transaction: {
    customerId?: string;
    type?: 'debt' | 'payment';
    amount?: number;
    note?: string;
    date?: string;
  }) => {
    if (!user?.id) throw new Error('User not authenticated');

    if (navigator.onLine) {
      // Online: update directly
      const updateData: {
        customer_id?: string;
        type?: 'debt' | 'payment';
        amount?: number;
        description?: string | null;
        transaction_date?: string;
      } = {};

      if (transaction.customerId) updateData.customer_id = transaction.customerId;
      if (transaction.type) updateData.type = transaction.type;
      if (transaction.amount !== undefined) updateData.amount = transaction.amount;
      if (transaction.note !== undefined) updateData.description = transaction.note || null;
      if (transaction.date) updateData.transaction_date = transaction.date;

      const updatedTransaction = await transactionsService.updateTransaction(transactionId, updateData);

      // Update local state
      setTransactions(transactions.map(t =>
        t.id === transactionId
          ? { ...t, ...updatedTransaction }
          : t
      ));

      // Update cache
      await offlineCache.setTransaction(transactionToCached({
        ...transactions.find(t => t.id === transactionId)!,
        ...updatedTransaction,
      }));

      return updatedTransaction;
    } else {
      // Offline: update optimistically
      const currentTransaction = transactions.find(t => t.id === transactionId);
      if (!currentTransaction) throw new Error('Transaction not found');

      const optimisticTransaction: Transaction = {
        ...currentTransaction,
        customer_id: transaction.customerId || currentTransaction.customer_id,
        type: transaction.type || currentTransaction.type,
        amount: transaction.amount !== undefined ? transaction.amount : currentTransaction.amount,
        description: transaction.note !== undefined ? transaction.note : currentTransaction.description,
        transaction_date: transaction.date || currentTransaction.transaction_date,
      };

      // Update local state optimistically
      setTransactions(transactions.map(t =>
        t.id === transactionId ? optimisticTransaction : t
      ));

      // Queue for background sync
      await offlineCache.addToSyncQueue({
        action_type: 'update_transaction',
        payload: {
          userId: user.id,
          transactionId,
          transaction,
        },
        client_timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending',
      });

      // Update cache optimistically
      await offlineCache.setTransaction(transactionToCached(optimisticTransaction));

      return optimisticTransaction;
    }
  };

  return {
    transactions,
    loading,
    isOffline,
    createTransaction,
    updateTransaction,
    refreshTransactions,
  };
}
