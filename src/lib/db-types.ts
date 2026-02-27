// ============================================
// Supabase Query Helpers - Best Practices
// ============================================
// Re-exports types from database.types.ts (auto-generated)
// This file contains optimized query helper classes
// ============================================

// Re-export types from the auto-generated file
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  UserProfile,
  Customer,
  Transaction,
  Subscription,
  SyncQueue,
  CustomerBalance,
  SubscriptionPlan,
  TransactionType,
  SyncStatus,
  SyncActionType,
} from "./database.types";

export {
  Constants,
  TRANSACTION_TYPES,
  SYNC_STATUS,
  SYNC_ACTION_TYPES,
} from "./database.types";

// ============================================
// Best Practices Query Helpers
// ============================================

import { SupabaseClient } from "@supabase/supabase-js";

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
      .from("customers")
      .select("id, name, phone, created_at")
      .eq("is_deleted", false) // Partial index'i tetikler
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);
  }

  /**
   * Customer detail with balance - covering index kullanır
   * İndeks: idx_customers_list, idx_transactions_balance_calc
   */
  async getCustomerWithBalance(customerId: string) {
    const [customer, balance] = await Promise.all([
      this.supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .eq("is_deleted", false)
        .single(),
      this.supabase.rpc("get_customer_balance", { p_customer_id: customerId }),
    ]);

    return { ...customer.data, balance: balance.data };
  }

  /**
   * Customer search - composite index kullanır
   * İndeks: idx_customers_active_name
   */
  async searchCustomers(query: string, limit = 20) {
    return this.supabase
      .from("customers")
      .select("id, name, phone")
      .eq("is_deleted", false)
      .ilike("name", `${query}%`) // Prefix search için index-friendly
      .limit(limit);
  }

  /**
   * Soft delete - UPDATE kullanır (DELETE değil)
   */
  async softDeleteCustomer(customerId: string) {
    return this.supabase
      .from("customers")
      .update({ is_deleted: true })
      .eq("id", customerId);
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
    type?: "debt" | "payment",
    limit = 50,
  ) {
    let query = this.supabase
      .from("transactions")
      .select("*")
      .eq("customer_id", customerId)
      .order("transaction_date", { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq("type", type); // Partial index'i tetikler
    }

    return query;
  }

  /**
   * Batch insert - connection pooling friendly
   */
  async batchInsertTransactions(
    transactions: Array<{
      customer_id: string;
      type: "debt" | "payment";
      amount: number;
      description?: string;
    }>,
  ) {
    return this.supabase.from("transactions").insert(transactions).select();
  }

  /**
   * Debt transactions için optimize edilmiş sorgu
   * İndeks: idx_transactions_debt_covering
   */
  async getCustomerDebts(customerId: string) {
    return this.supabase
      .from("transactions")
      .select("*")
      .eq("customer_id", customerId)
      .eq("type", "debt") // Partial index'i tetikler
      .order("amount", { ascending: false });
  }

  /**
   * Recent transactions with customer info
   * İndeks: idx_transactions_user_date
   */
  async getRecentTransactions(limit = 20) {
    return this.supabase
      .from("transactions")
      .select(
        `
        *,
        customers (
          id,
          name
        )
      `,
      )
      .order("transaction_date", { ascending: false })
      .limit(limit);
  }
}

/**
 * Dashboard sorguları - SECURITY DEFINER function ile güvenli
 * Artık tüm sorgular server-side JWT doğrulaması ile çalışıyor
 */
export class DashboardQueries {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Customer balances - SECURITY DEFINER function ile güvenli sorgu
   * auth.uid() == p_user_id kontrolü yapılır
   */
  async getCustomerBalances(userId: string) {
    return this.supabase.rpc("get_customer_balances", {
      p_user_id: userId,
    });
  }

  /**
   * Dashboard istatistikleri - SECURITY DEFINER function ile güvenli sorgu
   * auth.uid() == p_user_id kontrolü yapılır
   */
  async getDashboardStats(userId: string) {
    return this.supabase.rpc("get_dashboard_stats", {
      p_user_id: userId,
    });
  }

  /**
   * Son işlemler - SECURITY DEFINER function ile güvenli sorgu
   * auth.uid() == p_user_id kontrolü yapılır
   */
  async getRecentActivity(userId: string, limit = 10) {
    return this.supabase.rpc("get_recent_activity", {
      p_user_id: userId,
      p_limit: limit,
    });
  }

  /**
   * @deprecated Use getDashboardStats with userId instead
   * Bu method güvenlik açığına neden olabilir - herhangi bir userId filtresi yok!
   */
  async getDebtSummary() {
    console.warn(
      "DEPRECATED: getDebtSummary() is insecure. Use getDashboardStats(userId) instead.",
    );
    return {
      totalDebt: 0,
      customerCount: 0,
    };
  }
}

// ============================================
// Factory function
// ============================================
export function createQueries(supabase: SupabaseClient) {
  return {
    customers: new CustomerQueries(supabase),
    transactions: new TransactionQueries(supabase),
    dashboard: new DashboardQueries(supabase),
  };
}
