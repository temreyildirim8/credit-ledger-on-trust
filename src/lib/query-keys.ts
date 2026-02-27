/**
 * Centralized query keys factory for type-safe React Query keys
 * Following best practices from https://tanstack.com/query/latest/docs/react/guides/query-keys
 */

/**
 * Base query key structure that ensures consistency
 */
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
    activity: (limit?: number) =>
      [...queryKeys.dashboard.all, "activity", limit] as const,
  },

  // Customer queries
  customers: {
    all: ["customers"] as const,
    lists: () => [...queryKeys.customers.all, "list"] as const,
    list: (filters?: { search?: string }) =>
      [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    transactions: (customerId: string) =>
      [...queryKeys.customers.all, "transactions", customerId] as const,
  },

  // Transaction queries
  transactions: {
    all: ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all, "list"] as const,
    list: (filters?: {
      customerId?: string;
      type?: "debt" | "payment";
      startDate?: string;
      endDate?: string;
    }) => [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
  },

  // User profile queries
  userProfile: {
    all: ["userProfile"] as const,
    current: () => [...queryKeys.userProfile.all, "current"] as const,
  },

  // Exchange rate queries
  exchangeRates: {
    all: ["exchangeRates"] as const,
    current: () => [...queryKeys.exchangeRates.all, "current"] as const,
  },

  // Subscription queries
  subscription: {
    all: ["subscription"] as const,
    current: () => [...queryKeys.subscription.all, "current"] as const,
  },
} as const;

/**
 * Helper to invalidate all queries (useful on logout)
 */
export const invalidateAllQueries = () => ["invalidateAll"] as const;
