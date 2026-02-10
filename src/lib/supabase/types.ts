// Supabase Database Types
// Bu dosya Supabase'den generate edilebilir veya manuel tanımlanabilir

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
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          type: 'debt' | 'payment'
          amount: number
          description?: string | null
          transaction_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          type?: 'debt' | 'payment'
          amount?: number
          description?: string | null
          transaction_date?: string
          created_at?: string
        }
      }
    }
    Views: {
      customer_balances: {
        Row: {
          id: string
          name: string
          phone: string | null
          is_deleted: boolean
          balance: number
          transaction_count: number
          created_at: string
        }
      }
    }
  }
}

// TypeScript türleri
export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type CustomerBalance = Database['public']['Views']['customer_balances']['Row']

// İşlem türü
export type TransactionType = 'debt' | 'payment'

// Müşteri ile işlem bilgisi
export interface CustomerWithTransactions extends Customer {
  transactions?: Transaction[]
  balance?: number
}

// İstatistikler
export interface DashboardStats {
  totalDebt: number
  totalPayment: number
  netBalance: number
  customerCount: number
  activeCustomerCount: number
}