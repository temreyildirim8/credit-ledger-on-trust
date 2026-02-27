/**
 * Database Types - PRD V8 MVP Core
 * Auto-generated from Supabase
 * Generated: February 22, 2026
 *
 * MVP Tables:
 * - user_profiles: Extended user info (currency, language, industry, onboarding)
 * - customers: Customer directory
 * - transactions: Debt/payment records
 * - subscriptions: Plan tracking (freemium paywall)
 * - sync_queue: Offline sync management
 * - config: Application configuration (plan limits, features, etc.)
 *
 * Views:
 * - customer_balances: Customer balance aggregation
 *
 * v2 Features (deferred):
 * - Supplier Ledger, Cashbook, Marketing Tools, Team Management, Calculators
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          name: string;
          national_id: string | null;
          notes: string | null;
          phone: string | null;
          tenant_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          name: string;
          national_id?: string | null;
          notes?: string | null;
          phone?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          name?: string;
          national_id?: string | null;
          notes?: string | null;
          phone?: string | null;
          tenant_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan: Database["public"]["Enums"]["subscription_plan"];
          sms_limit: number | null;
          sms_used: number | null;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          sms_limit?: number | null;
          sms_used?: number | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["subscription_plan"];
          sms_limit?: number | null;
          sms_used?: number | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      config: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sync_queue: {
        Row: {
          action_type: string;
          client_timestamp: string;
          created_at: string | null;
          error_message: string | null;
          id: string;
          max_retries: number | null;
          payload: Json;
          retry_count: number | null;
          status: string | null;
          synced_at: string | null;
          user_id: string;
        };
        Insert: {
          action_type: string;
          client_timestamp: string;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          max_retries?: number | null;
          payload: Json;
          retry_count?: number | null;
          status?: string | null;
          synced_at?: string | null;
          user_id: string;
        };
        Update: {
          action_type?: string;
          client_timestamp?: string;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          max_retries?: number | null;
          payload?: Json;
          retry_count?: number | null;
          status?: string | null;
          synced_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          created_at: string | null;
          customer_id: string;
          description: string | null;
          id: string;
          tenant_id: string | null;
          transaction_date: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          customer_id: string;
          description?: string | null;
          id?: string;
          tenant_id?: string | null;
          transaction_date?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          customer_id?: string;
          description?: string | null;
          id?: string;
          tenant_id?: string | null;
          transaction_date?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          address: string | null;
          created_at: string | null;
          currency: string | null;
          default_currency: string | null;
          full_name: string | null;
          id: string;
          industry: string | null;
          language: string | null;
          logo_url: string | null;
          onboarding_completed: boolean | null;
          phone: string | null;
          shop_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          currency?: string | null;
          default_currency?: string | null;
          full_name?: string | null;
          id: string;
          industry?: string | null;
          language?: string | null;
          logo_url?: string | null;
          onboarding_completed?: boolean | null;
          phone?: string | null;
          shop_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          currency?: string | null;
          default_currency?: string | null;
          full_name?: string | null;
          id?: string;
          industry?: string | null;
          language?: string | null;
          logo_url?: string | null;
          onboarding_completed?: boolean | null;
          phone?: string | null;
          shop_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      customer_balances: {
        Row: {
          address: string | null;
          balance: number | null;
          created_at: string | null;
          id: string | null;
          is_deleted: boolean | null;
          last_transaction_date: string | null;
          name: string | null;
          national_id: string | null;
          notes: string | null;
          phone: string | null;
          transaction_count: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_customer_limit: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      /**
       * SECURITY DEFINER function that returns customer balances for a given user_id
       * Enforces that auth.uid() == p_user_id before returning data
       * See migration: 20250227_secure_customer_balances.sql
       * @param p_user_id - The user ID to fetch customers for
       * @param p_include_archived - Optional, when true includes archived customers
       */
      get_customer_balances: {
        Args: {
          p_user_id: string;
          p_include_archived?: boolean;
        };
        Returns: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          address: string | null;
          notes: string | null;
          national_id: string | null;
          balance: number | null;
          transaction_count: number | null;
          last_transaction_date: string | null;
          is_deleted: boolean | null;
          created_at: string | null;
        }[];
      };
      /**
       * SECURITY DEFINER function that returns total customer count (including archived)
       * Used for plan limit enforcement
       * @param p_user_id - The user ID to count customers for
       */
      get_total_customer_count: {
        Args: {
          p_user_id: string;
        };
        Returns: number;
      };
      /**
       * SECURITY DEFINER function that returns aggregated dashboard statistics
       * Enforces that auth.uid() == p_user_id before returning data
       * Returns: total_debt, total_collected, active_customers, total_transactions
       */
      get_dashboard_stats: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          total_debt: number;
          total_collected: number;
          active_customers: number;
          total_transactions: number;
        }[];
      };
      /**
       * SECURITY DEFINER function that returns recent transaction activity
       * Enforces that auth.uid() == p_user_id before returning data
       */
      get_recent_activity: {
        Args: {
          p_user_id: string;
          p_limit?: number;
        };
        Returns: {
          id: string;
          customer_name: string;
          type: string;
          amount: number;
          transaction_date: string | null;
        }[];
      };
    };
    Enums: {
      subscription_plan: "free" | "pro" | "enterprise";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience type exports
export type Tables<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][EnumName];

// Core MVP table types
export type UserProfile = Tables<"user_profiles">;
export type Customer = Tables<"customers">;
export type Transaction = Tables<"transactions">;
export type Subscription = Tables<"subscriptions">;
export type SyncQueue = Tables<"sync_queue">;
export type Config = Tables<"config">;

// View types
export type CustomerBalance =
  Database["public"]["Views"]["customer_balances"]["Row"];

// Enum types
export type SubscriptionPlan = Enums<"subscription_plan">;

// Constants
export const Constants = {
  public: {
    Enums: {
      subscription_plan: ["free", "pro", "enterprise"] as const,
    },
  },
} as const;

// Transaction types
export const TRANSACTION_TYPES = ["debt", "payment"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// Sync queue status
export const SYNC_STATUS = ["pending", "syncing", "synced", "failed"] as const;
export type SyncStatus = (typeof SYNC_STATUS)[number];

// Sync action types for MVP
export const SYNC_ACTION_TYPES = [
  "create_customer",
  "update_customer",
  "delete_customer",
  "create_transaction",
  "update_transaction",
  "delete_transaction",
] as const;
export type SyncActionType = (typeof SYNC_ACTION_TYPES)[number];
