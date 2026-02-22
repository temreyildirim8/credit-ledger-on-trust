import { supabase } from '@/lib/supabase/client';

export interface DashboardStats {
  totalDebt: number;
  totalCollected: number;
  activeCustomers: number;
}

export interface RecentActivity {
  id: string;
  customerName: string;
  type: 'debt' | 'payment';
  amount: number;
  date: string | null;
}

interface CustomerBalanceRow {
  balance: number | null;
}

interface PaymentRow {
  amount: number;
}

interface TransactionWithCustomerName {
  id: string;
  type: string;
  amount: number;
  transaction_date: string | null;
  customers: {
    name: string | null;
  } | null;
}

export const dashboardService = {
  async getStats(userId: string): Promise<DashboardStats> {
    // Get customer balances
    const { data: customers } = await supabase
      .from('customer_balances')
      .select('balance')
      .eq('user_id', userId);

    const totalDebt = (customers as CustomerBalanceRow[] | null)?.reduce(
      (sum, c) => sum + (c.balance || 0),
      0
    ) || 0;

    // Get total collected (payments)
    const { data: payments } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'payment');

    const totalCollected = (payments as PaymentRow[] | null)?.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    ) || 0;

    // Get active customers
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    return {
      totalDebt,
      totalCollected,
      activeCustomers: count || 0,
    };
  },

  async getRecentActivity(userId: string, limit = 5): Promise<RecentActivity[]> {
    const { data } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        transaction_date,
        customers (
          name
        )
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    return ((data as TransactionWithCustomerName[] | null) || []).map((t) => ({
      id: t.id,
      customerName: t.customers?.name || 'Bilinmeyen',
      type: t.type as 'debt' | 'payment',
      amount: t.amount,
      date: t.transaction_date,
    }));
  },
};
