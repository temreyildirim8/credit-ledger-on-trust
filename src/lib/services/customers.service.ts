import { supabase } from '@/lib/supabase/client';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  created_at: string;
}

export const customersService = {
  async getCustomers(userId: string): Promise<Customer[]> {
    const { data } = await supabase
      .from('customer_balances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data || []) as Customer[];
  },

  async getCustomerById(userId: string, customerId: string): Promise<Customer | null> {
    const { data } = await supabase
      .from('customer_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('id', customerId)
      .single();

    return data as Customer | null;
  },

  async createCustomer(userId: string, customer: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        tenant_id: userId, // Using userId as tenant_id for single-tenant setup
        name: customer.name,
        phone: customer.phone || null,
        address: customer.address || null,
        notes: customer.notes || null,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCustomer(customerId: string, customer: {
    name?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) {
    const { data, error } = await (supabase
      .from('customers') as any)
      .update(customer)
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCustomerTransactions(userId: string, customerId: string) {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .order('transaction_date', { ascending: false });

    return data || [];
  },
};
