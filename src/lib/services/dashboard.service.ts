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
  date: string;
}

export const dashboardService = {
  async getStats(userId: string): Promise<DashboardStats> {
    // Get customer balances
    const { data: customers } = await (supabase
      .from('customer_balances') as any)
      .select('balance')
      .eq('user_id', userId);

    const totalDebt = customers?.reduce((sum: number, c: any) => sum + (c.balance || 0), 0) || 0;

    // Get total collected (payments)
    const { data: payments } = await (supabase
      .from('transactions') as any)
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'payment');

    const totalCollected = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

    // Get active customers
    const { count } = await (supabase
      .from('customers') as any)
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
    const { data } = await (supabase
      .from('transactions') as any)
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

    return (data || []).map((t: any) => ({
      id: t.id,
      customerName: t.customers?.name || 'Bilinmeyen',
      type: t.type,
      amount: t.amount,
      date: t.transaction_date,
    }));
  },
};
