export interface DashboardStats {
  totalDebt: number;
  totalCollected: number;
  activeCustomers: number;
  totalTransactions: number;
  currency: string;
  usdEquivalent: {
    totalDebt: number;
    totalCollected: number;
  };
}

export interface RecentActivity {
  id: string;
  customerName: string;
  type: "debt" | "payment";
  amount: number;
  date: string | null;
}

export const dashboardService = {
  /**
   * Get dashboard statistics for the authenticated user
   * Uses secure API route (server-side JWT validation)
   */
  async getStats(): Promise<DashboardStats> {
    const response = await fetch("/api/dashboard/stats", {
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
      throw new Error(error.error || "Failed to fetch dashboard stats");
    }

    return response.json();
  },

  /**
   * Get recent transaction activity for the dashboard
   * Uses secure API route (server-side JWT validation)
   * @param limit Number of recent activities to return (default: 5)
   */
  async getRecentActivity(limit = 5): Promise<RecentActivity[]> {
    const response = await fetch(`/api/dashboard/activity?limit=${limit}`, {
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
      throw new Error(error.error || "Failed to fetch recent activity");
    }

    const data = await response.json();

    return (data || []).map(
      (t: {
        id: string;
        customer_name: string | null;
        type: string;
        amount: number;
        transaction_date: string | null;
      }) => ({
        id: t.id,
        customerName: t.customer_name || "Unknown",
        type: t.type as "debt" | "payment",
        amount: t.amount,
        date: t.transaction_date,
      }),
    );
  },
};
