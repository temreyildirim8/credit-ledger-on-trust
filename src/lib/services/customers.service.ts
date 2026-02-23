import { supabase } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate, CustomerBalance } from '@/lib/database.types';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address?: string | null;
  notes?: string | null;
  balance: number;
  transaction_count?: number | null;
  last_transaction_date?: string | null;
  is_deleted?: boolean | null;
  created_at: string | null;
}

export const customersService = {
  async getCustomers(userId: string): Promise<Customer[]> {
    const { data } = await supabase
      .from('customer_balances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data || []).map(row => ({
      id: row.id!,
      user_id: row.user_id!,
      name: row.name!,
      phone: row.phone,
      balance: row.balance || 0,
      transaction_count: row.transaction_count,
      last_transaction_date: row.last_transaction_date,
      is_deleted: row.is_deleted,
      created_at: row.created_at,
    }));
  },

  async getCustomerById(userId: string, customerId: string): Promise<Customer | null> {
    const { data } = await supabase
      .from('customer_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('id', customerId)
      .single();

    if (!data) return null;

    return {
      id: data.id!,
      user_id: data.user_id!,
      name: data.name!,
      phone: data.phone,
      balance: data.balance || 0,
      transaction_count: data.transaction_count,
      last_transaction_date: data.last_transaction_date,
      is_deleted: data.is_deleted,
      created_at: data.created_at,
    };
  },

  async createCustomer(userId: string, customer: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }): Promise<Customer> {
    const insertData: TablesInsert<'customers'> = {
      user_id: userId,
      name: customer.name,
      phone: customer.phone || null,
      address: customer.address || null,
      notes: customer.notes || null,
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    // Return with default balance of 0 for new customers
    return {
      ...data,
      balance: 0,
    };
  },

  async updateCustomer(customerId: string, customer: TablesUpdate<'customers'>) {
    const { data, error } = await supabase
      .from('customers')
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

  async archiveCustomer(customerId: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({ is_deleted: true })
      .eq('id', customerId);

    if (error) throw error;
  },

  async deleteCustomer(customerId: string): Promise<void> {
    // First delete all transactions for this customer
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .eq('customer_id', customerId);

    if (transactionsError) throw transactionsError;

    // Then delete the customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) throw error;
  },
};
