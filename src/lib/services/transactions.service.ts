import { supabase } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';

export interface Transaction {
  id: string;
  customer_id: string;
  type: 'debt' | 'payment';
  amount: number;
  description: string | null;
  transaction_date: string | null;
  created_at: string | null;
  customer_name?: string;
  note?: string | null;
}

interface CustomerBasic {
  id: string;
  name: string;
}

export const transactionsService = {
  async getTransactions(userId: string): Promise<Transaction[]> {
    const { data } = await supabase
      .from('transactions')
      .select(`
        id,
        customer_id,
        type,
        amount,
        description,
        transaction_date,
        created_at,
        customers (
          name
        )
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    return (data || []).map((t) => ({
      id: t.id,
      customer_id: t.customer_id,
      type: t.type as 'debt' | 'payment',
      amount: t.amount,
      description: t.description,
      transaction_date: t.transaction_date,
      created_at: t.created_at,
      customer_name: t.customers?.name,
    }));
  },

  async createTransaction(userId: string, transaction: {
    customerId: string;
    type: 'debt' | 'payment';
    amount: number;
    note?: string;
    date?: string;
  }): Promise<Transaction> {
    const insertData: TablesInsert<'transactions'> = {
      user_id: userId,
      customer_id: transaction.customerId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.note || null,
      transaction_date: transaction.date || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      customer_id: data.customer_id,
      type: data.type as 'debt' | 'payment',
      amount: data.amount,
      description: data.description,
      transaction_date: data.transaction_date,
      created_at: data.created_at,
    };
  },

  async getCustomers(userId: string): Promise<CustomerBasic[]> {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('name');

    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
    }));
  },

  /**
   * Update an existing transaction
   * SECURITY: Requires userId to verify ownership before updating
   * @throws Error if transaction not found or doesn't belong to user
   */
  async updateTransaction(userId: string, transactionId: string, transaction: {
    customer_id?: string;
    type?: 'debt' | 'payment';
    amount?: number;
    description?: string | null;
    transaction_date?: string;
  }): Promise<Transaction> {
    // SECURITY: Verify ownership by including user_id in the query
    const { data, error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', transactionId)
      .eq('user_id', userId) // IDOR fix: verify ownership
      .select()
      .single();

    if (error) {
      // If no rows returned, either transaction doesn't exist or doesn't belong to user
      if (error.code === 'PGRST116') {
        throw new Error('Transaction not found or access denied');
      }
      throw error;
    }

    return {
      id: data.id,
      customer_id: data.customer_id,
      type: data.type as 'debt' | 'payment',
      amount: data.amount,
      description: data.description,
      transaction_date: data.transaction_date,
      created_at: data.created_at,
    };
  },

  /**
   * Delete a transaction
   * SECURITY: Requires userId to verify ownership before deleting
   * @throws Error if transaction not found or doesn't belong to user
   */
  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    // SECURITY: Verify ownership by including user_id in the query
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId); // IDOR fix: verify ownership

    if (error) {
      throw error;
    }
  },

  /**
   * Get a single transaction by ID
   * SECURITY: Requires userId to verify ownership
   */
  async getTransactionById(userId: string, transactionId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        customer_id,
        type,
        amount,
        description,
        transaction_date,
        created_at,
        customers (name)
      `)
      .eq('id', transactionId)
      .eq('user_id', userId) // IDOR fix: verify ownership
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found or access denied
      }
      throw error;
    }

    return {
      id: data.id,
      customer_id: data.customer_id,
      type: data.type as 'debt' | 'payment',
      amount: data.amount,
      description: data.description,
      transaction_date: data.transaction_date,
      created_at: data.created_at,
      customer_name: data.customers?.name,
    };
  },
};
