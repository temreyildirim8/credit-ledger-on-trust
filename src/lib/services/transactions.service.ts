export interface Transaction {
  id: string;
  customer_id: string;
  type: "debt" | "payment";
  amount: number;
  description: string | null;
  transaction_date: string | null;
  created_at: string | null;
  customer_name?: string;
  note?: string | null;
}

interface CustomerBasic {
  id: string;
  name: string;
}

export const transactionsService = {
  /**
   * Get all transactions for the authenticated user
   * Uses secure API route (server-side JWT validation)
   */
  async getTransactions(_userId: string): Promise<Transaction[]> {
    const response = await fetch("/api/transactions", {
      method: "GET",
      credentials: "include",
    });

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
   * Create a new transaction
   * Uses secure API route (server-side JWT validation)
   */
  async createTransaction(
    _userId: string,
    transaction: {
      customerId: string;
      type: "debt" | "payment";
      amount: number;
      note?: string;
      date?: string;
    },
  ): Promise<Transaction> {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        customerId: transaction.customerId,
        type: transaction.type,
        amount: transaction.amount,
        note: transaction.note,
        date: transaction.date,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to create transaction");
    }

    const data = await response.json();
    return data.transaction;
  },

  /**
   * Get customers for transaction form dropdown
   * Uses secure API route (server-side JWT validation)
   */
  async getCustomers(_userId: string): Promise<CustomerBasic[]> {
    const response = await fetch("/api/customers", {
      method: "GET",
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
    return (data.customers || []).map((c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name,
    }));
  },

  /**
   * Update an existing transaction
   * Uses secure API route (server-side JWT validation)
   */
  async updateTransaction(
    _userId: string,
    transactionId: string,
    transaction: {
      customer_id?: string;
      type?: "debt" | "payment";
      amount?: number;
      description?: string | null;
      transaction_date?: string;
    },
  ): Promise<Transaction> {
    const response = await fetch("/api/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        transactionId,
        customerId: transaction.customer_id,
        type: transaction.type,
        amount: transaction.amount,
        note: transaction.description,
        date: transaction.transaction_date,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to update transaction");
    }

    const data = await response.json();
    return data.transaction;
  },

  /**
   * Delete a transaction
   * Uses secure API route (server-side JWT validation)
   */
  async deleteTransaction(
    _userId: string,
    transactionId: string,
  ): Promise<void> {
    const response = await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ transactionId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to delete transaction");
    }
  },

  /**
   * Get a single transaction by ID
   * Uses secure API route (server-side JWT validation)
   */
  async getTransactionById(
    userId: string,
    transactionId: string,
  ): Promise<Transaction | null> {
    const transactions = await this.getTransactions(userId);
    return transactions.find((t) => t.id === transactionId) || null;
  },
};
