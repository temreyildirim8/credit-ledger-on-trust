'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { transactionsService, Transaction } from '@/lib/services/transactions.service';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadTransactions = async () => {
      setLoading(true);
      try {
        const data = await transactionsService.getTransactions(user.id);
        setTransactions(data);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user?.id]);

  const createTransaction = async (transaction: {
    customerId: string;
    type: 'debt' | 'payment';
    amount: number;
    note?: string;
    date?: string;
  }) => {
    if (!user?.id) throw new Error('User not authenticated');

    const newTransaction = await transactionsService.createTransaction(user.id, transaction);
    setTransactions([newTransaction, ...transactions]);
    return newTransaction;
  };

  return { transactions, loading, createTransaction };
}
