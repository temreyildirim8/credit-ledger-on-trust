// ============================================
// Supabase Database Types - Best Practices Uygulamalı
// ============================================
// Bu dosya Supabase'den otomatik oluşturulan types içindir
// Supabase CLI ile: supabase gen types typescript > src/lib/database.types.ts
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          notes: string | null
          is_deleted: boolean
          user_id: string
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          is_deleted?: boolean
          user_id?: string
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          is_deleted?: boolean
          user_id?: string
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          customer_id: string
          type: 'debt' | 'payment'
          amount: number
          description: string | null
          transaction_date: string
          user_id: string
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          type: 'debt' | 'payment'
          amount: number
          description?: string | null
          transaction_date?: string
          user_id?: string
          tenant_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          type?: 'debt' | 'payment'
          amount?: number
          description?: string | null
          transaction_date?: string
          user_id?: string
          tenant_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      customer_balances: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          is_deleted: boolean
          balance: number
          transaction_count: number
          last_transaction_date: string | null
          created_at: string
        }
      }
    }
    Functions: {
      get_customer_balance: {
        Args: {
          p_customer_id: string
        }
        Returns: number
      }
      create_customer: {
        Args: {
          p_name: string
          p_phone?: string
          p_address?: string
          p_notes?: string
        }
        Returns: string
      }
    }
  }
}

// ============================================
// Best Practices Query Helpers
// ============================================

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Müşteri sorguları için best practices
 */
export class CustomerQueries {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Active customers listesi - partial index kullanır
   * İndeks: idx_customers_active_name, idx_customers_list
   */
  async getActiveCustomers(limit = 50, offset = 0) {
    return this.supabase
      .from('customers')
      .select('id, name, phone, created_at')
      .eq('is_deleted', false)  // Partial index'i tetikler
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)
  }

  /**
   * Customer detail with balance - covering index kullanır
   * İndeks: idx_customers_list, idx_transactions_balance_calc
   */
  async getCustomerWithBalance(customerId: string) {
    const [customer, balance] = await Promise.all([
      this.supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('is_deleted', false)
        .single(),
      this.supabase.rpc('get_customer_balance', { p_customer_id: customerId })
    ])

    return { ...customer.data, balance: balance.data }
  }

  /**
   * Customer search - composite index kullanır
   * İndeks: idx_customers_active_name
   */
  async searchCustomers(query: string, limit = 20) {
    return this.supabase
      .from('customers')
      .select('id, name, phone')
      .eq('is_deleted', false)
      .ilike('name', `${query}%`)  // Prefix search için index-friendly
      .limit(limit)
  }

  /**
   * Soft delete - UPDATE kullanır (DELETE değil)
   */
  async softDeleteCustomer(customerId: string) {
    return this.supabase
      .from('customers')
      .update({ is_deleted: true })
      .eq('id', customerId)
  }
}

/**
 * Transaction sorguları için best practices
 */
export class TransactionQueries {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Customer transactions - composite index kullanır
   * İndeks: idx_transactions_balance_calc, idx_transactions_user_date
   */
  async getCustomerTransactions(
    customerId: string,
    type?: 'debt' | 'payment',
    limit = 50
  ) {
    let query = this.supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('transaction_date', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('type', type)  // Partial index'i tetikler
    }

    return query
  }

  /**
   * Batch insert - connection pooling friendly
   */
  async batchInsertTransactions(transactions: Array<{
    customer_id: string
    type: 'debt' | 'payment'
    amount: number
    description?: string
  }>) {
    return this.supabase
      .from('transactions')
      .insert(transactions)
      .select()
  }

  /**
   * Debt transactions için optimize edilmiş sorgu
   * İndeks: idx_transactions_debt_covering
   */
  async getCustomerDebts(customerId: string) {
    return this.supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('type', 'debt')  // Partial index'i tetikler
      .order('amount', { ascending: false })
  }

  /**
   * Recent transactions with customer info
   * İndeks: idx_transactions_user_date
   */
  async getRecentTransactions(limit = 20) {
    return this.supabase
      .from('transactions')
      .select(`
        *,
        customers (
          id,
          name
        )
      `)
      .order('transaction_date', { ascending: false })
      .limit(limit)
  }
}

/**
 * Dashboard sorguları - covering index optimized
 */
export class DashboardQueries {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Customer balances view - covering index kullanır
   */
  async getCustomerBalances(limit = 50) {
    return this.supabase
      .from('customer_balances')
      .select('*')
      .order('balance', { ascending: false })
      .limit(limit)
  }

  /**
   * Toplam borç özeti
   */
  async getDebtSummary() {
    const { data } = await this.supabase
      .from('customer_balances')
      .select('balance')

    return {
      totalDebt: data?.reduce((sum, row) => sum + (row.balance || 0), 0) || 0,
      customerCount: data?.length || 0
    }
  }

  /**
   * Son işlemler with customer info
   */
  async getRecentActivity(limit = 10) {
    return this.supabase
      .from('transactions')
      .select(`
        *,
        customers (
          name,
          phone
        )
      `)
      .order('transaction_date', { ascending: false })
      .limit(limit)
  }
}

// ============================================
// Factory function
// ============================================
export function createQueries(supabase: SupabaseClient) {
  return {
    customers: new CustomerQueries(supabase),
    transactions: new TransactionQueries(supabase),
    dashboard: new DashboardQueries(supabase)
  }
}
