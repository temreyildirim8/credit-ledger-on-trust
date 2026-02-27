import type { TablesUpdate } from "@/lib/database.types";

export interface Customer {
  id: string;
  user_id: string;
  national_id?: string | null;
  name: string;
  phone: string | null;
  address?: string | null;
  notes?: string | null;
  balance: number;
  transaction_count?: number | null;
  last_transaction_date?: string | null;
  is_deleted?: boolean | null;
  is_archived?: boolean | null;
  created_at: string | null;
  updated_at?: string | null;
}

export interface GetCustomersResponse {
  customers: Customer[];
  totalCount: number;
}

export const customersService = {
  /**
   * Get all customers for the authenticated user
   * Uses secure API route (server-side JWT validation) instead of direct browser access
   * @param includeArchived - When true, includes archived customers in the response
   * @returns Object with customers array and totalCount (for plan limit checking)
   */
  async getCustomers(includeArchived = false): Promise<GetCustomersResponse> {
    const url = includeArchived
      ? "/api/customers?includeArchived=true"
      : "/api/customers";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: sends cookies with JWT
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch customers");
    }

    const data = await response.json();

    // Handle both old format (array) and new format (object with customers and totalCount)
    if (Array.isArray(data)) {
      return {
        customers: data.map((row: Customer) => ({
          id: row.id,
          user_id: row.user_id,
          national_id: row.national_id ?? null,
          name: row.name,
          phone: row.phone,
          address: row.address,
          notes: row.notes,
          balance: row.balance || 0,
          transaction_count: row.transaction_count,
          last_transaction_date: row.last_transaction_date,
          is_deleted: row.is_deleted,
          created_at: row.created_at,
        })),
        totalCount: data.length,
      };
    }

    return {
      customers: (data.customers || []).map((row: Customer) => ({
        id: row.id,
        user_id: row.user_id,
        national_id: row.national_id ?? null,
        name: row.name,
        phone: row.phone,
        address: row.address,
        notes: row.notes,
        balance: row.balance || 0,
        transaction_count: row.transaction_count,
        last_transaction_date: row.last_transaction_date,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
      })),
      totalCount: data.totalCount ?? data.customers?.length ?? 0,
    };
  },

  /**
   * Get a single customer by ID
   * Note: This requires fetching all customers and filtering on client side
   * since the secure API returns only the current user's customers
   */
  async getCustomerById(
    _userId: string,
    customerId: string,
  ): Promise<Customer | null> {
    // Fetch all customers for the current user (they're already filtered server-side)
    const { customers } = await customersService.getCustomers();
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer || null;
  },

  /**
   * Create a new customer
   * Uses direct Supabase client (legacy pattern - kept for insert operations)
   * @deprecated Consider migrating to /api/customers POST endpoint
   */
  async createCustomer(
    userId: string,
    customer: {
      national_id?: string;
      name: string;
      phone?: string;
      address?: string;
      notes?: string;
    },
  ): Promise<Customer> {
    // Dynamic import to avoid circular dependency issues
    const { supabase } = await import("@/lib/supabase/client");

    const insertData = {
      user_id: userId,
      national_id: customer.national_id?.trim() || null,
      name: customer.name,
      phone: customer.phone || null,
      address: customer.address || null,
      notes: customer.notes || null,
    };

    const { data, error } = await supabase
      .from("customers")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      national_id: data.national_id ?? null,
      balance: 0,
    };
  },

  /**
   * Update an existing customer
   * SECURITY: Requires userId to verify ownership before updating
   * @throws Error if customer not found or doesn't belong to user
   */
  async updateCustomer(
    userId: string,
    customerId: string,
    customer: TablesUpdate<"customers"> & { national_id?: string | null },
  ) {
    const { supabase } = await import("@/lib/supabase/client");

    // SECURITY: Verify ownership by including user_id in the query
    const { data, error } = await supabase
      .from("customers")
      .update(customer)
      .eq("id", customerId)
      .eq("user_id", userId) // IDOR fix: verify ownership
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Customer not found or access denied");
      }
      throw error;
    }
    return data;
  },

  /**
   * Get transactions for a specific customer
   * SECURITY: Requires userId to verify ownership
   * Uses direct Supabase client with RLS protection
   */
  async getCustomerTransactions(userId: string, customerId: string) {
    const { supabase } = await import("@/lib/supabase/client");

    // First verify the customer belongs to the user
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("user_id", userId)
      .single();

    if (!customer) {
      throw new Error("Customer not found or access denied");
    }

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("customer_id", customerId)
      .order("transaction_date", { ascending: false });

    return data || [];
  },

  /**
   * Soft delete (archive) a customer
   * SECURITY: Requires userId to verify ownership before archiving
   * @throws Error if customer not found or doesn't belong to user
   */
  async archiveCustomer(userId: string, customerId: string): Promise<void> {
    const { supabase } = await import("@/lib/supabase/client");

    // SECURITY: Verify ownership by including user_id in the query
    const { error } = await supabase
      .from("customers")
      .update({ is_deleted: true })
      .eq("id", customerId)
      .eq("user_id", userId); // IDOR fix: verify ownership

    if (error) throw error;
  },

  /**
   * Permanently delete a customer and all their transactions
   * SECURITY: Requires userId to verify ownership before deleting
   * @throws Error if customer not found or doesn't belong to user
   */
  async deleteCustomer(userId: string, customerId: string): Promise<void> {
    const { supabase } = await import("@/lib/supabase/client");

    // First verify the customer belongs to the user
    const { data: customer, error: verifyError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("user_id", userId)
      .single();

    if (verifyError || !customer) {
      throw new Error("Customer not found or access denied");
    }

    // Delete all transactions for this customer (with user_id check for extra security)
    const { error: transactionsError } = await supabase
      .from("transactions")
      .delete()
      .eq("customer_id", customerId)
      .eq("user_id", userId); // IDOR fix: only delete user's own transactions

    if (transactionsError) throw transactionsError;

    // Then delete the customer
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId)
      .eq("user_id", userId); // IDOR fix: verify ownership

    if (error) throw error;
  },
};
