import { supabase } from '@/lib/supabase/client';

export interface Transaction {
  id: string;
  customer_id: string;
  type: 'debt' | 'payment';
  amount: number;
  note: string | null;
  transaction_date: string;
  created_at: string;
  customer_name?: string;
}

export const transactionsService = {
  async getTransactions(userId: string): Promise<Transaction[]> {
    const { data } = await (supabase
      .from('transactions') as any)
      .select(`
        *,
        customers (
          name
        )
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    return (data || []).map((t: any) => ({
      ...t,
      customer_name: t.customers?.name,
    }));
  },

  async createTransaction(userId: string, transaction: {
    customerId: string;
    type: 'debt' | 'payment';
    amount: number;
    note?: string;
    date?: string;
  }) {
    const { data, error } = await (supabase
      .from('transactions') as any)
      .insert({
        user_id: userId,
        tenant_id: userId, // Using userId as tenant_id for single-tenant setup
        customer_id: transaction.customerId,
        type: transaction.type,
        amount: transaction.amount,
        note: transaction.note || null,
        transaction_date: transaction.date || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCustomers(userId: string) {
    const { data } = await (supabase
      .from('customers') as any)
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('name');

    return data || [];
  },
};
