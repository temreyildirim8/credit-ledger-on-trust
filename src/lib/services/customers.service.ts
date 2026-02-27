import type { Json } from "@/lib/database.types";

export interface Customer {
  id: string;
  user_id: string;
  national_id?: string | null;
  name: string;
  phone: string | null;
  address?: string | null;
  notes?: string | null;
  custom_fields?: Json | null;
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
   * Uses secure API route (server-side JWT validation)
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
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch customers");
    }

    const data = await response.json();

    return {
      customers: (data.customers || []).map((row: Customer) => ({
        id: row.id,
        user_id: row.user_id,
        national_id: row.national_id ?? null,
        name: row.name,
        phone: row.phone,
        address: row.address,
        notes: row.notes,
        custom_fields: row.custom_fields,
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
   * Uses secure API route (server-side JWT validation)
   */
  async getCustomerById(
    _userId: string,
    customerId: string,
  ): Promise<Customer | null> {
    const { customers } = await customersService.getCustomers();
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer || null;
  },

  /**
   * Create a new customer
   * Uses secure API route (server-side JWT validation)
   */
  async createCustomer(
    _userId: string,
    customer: {
      national_id?: string;
      name: string;
      phone?: string;
      address?: string;
      notes?: string;
      custom_fields?: Json;
    },
  ): Promise<Customer> {
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        national_id: customer.national_id,
        custom_fields: customer.custom_fields,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to create customer");
    }

    const data = await response.json();
    return {
      ...data.customer,
      national_id: data.customer.national_id ?? null,
      balance: 0,
    };
  },

  /**
   * Update an existing customer
   * Uses secure API route (server-side JWT validation)
   */
  async updateCustomer(
    _userId: string,
    customerId: string,
    customer: {
      name?: string;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
      national_id?: string | null;
      custom_fields?: Json | null;
    },
  ) {
    const response = await fetch("/api/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        customerId,
        ...customer,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      if (response.status === 404) {
        throw new Error("Customer not found or access denied");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to update customer");
    }

    const data = await response.json();
    return data.customer;
  },

  /**
   * Get transactions for a specific customer
   * Uses secure API route (server-side JWT validation)
   */
  async getCustomerTransactions(_userId: string, customerId: string) {
    const response = await fetch(
      `/api/transactions?customerId=${customerId}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch transactions");
    }

    const data = await response.json();
    return data.transactions || [];
  },

  /**
   * Soft delete (archive) a customer
   * Uses secure API route (server-side JWT validation)
   */
  async archiveCustomer(_userId: string, customerId: string): Promise<void> {
    const response = await fetch("/api/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ customerId, hardDelete: false }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      if (response.status === 404) {
        throw new Error("Customer not found or access denied");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to archive customer");
    }
  },

  /**
   * Permanently delete a customer and all their transactions
   * Uses secure API route (server-side JWT validation)
   */
  async deleteCustomer(_userId: string, customerId: string): Promise<void> {
    const response = await fetch("/api/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ customerId, hardDelete: true }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      if (response.status === 404) {
        throw new Error("Customer not found or access denied");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to delete customer");
    }
  },
};
