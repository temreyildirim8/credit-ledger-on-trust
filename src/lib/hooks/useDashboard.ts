"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  dashboardService,
  DashboardStats,
  RecentActivity,
} from "@/lib/services/dashboard.service";
import { queryKeys } from "@/lib/query-keys";

/**
 * Hook to fetch dashboard statistics
 * Uses React Query for caching and automatic refetching
 */
export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getStats(),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch recent activity for the dashboard
 * Uses React Query for caching and automatic refetching
 * @param limit Number of activities to fetch (default: 5)
 */
export function useRecentActivity(limit = 5) {
  const { user } = useAuth();

  return useQuery<RecentActivity[]>({
    queryKey: queryKeys.dashboard.activity(limit),
    queryFn: () => dashboardService.getRecentActivity(limit),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Combined hook for dashboard data (stats + recent activity)
 * Provides backward compatibility with the original useDashboard hook
 * Uses separate queries internally for better caching granularity
 */
export function useDashboard() {
  const { user } = useAuth();

  const statsQuery = useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getStats(),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const activityQuery = useQuery<RecentActivity[]>({
    queryKey: queryKeys.dashboard.activity(5),
    queryFn: () => dashboardService.getRecentActivity(5),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  return {
    stats: statsQuery.data ?? null,
    recentActivity: activityQuery.data ?? [],
    loading: statsQuery.isLoading || activityQuery.isLoading,
    // Additional React Query states for advanced use cases
    isFetching: statsQuery.isFetching || activityQuery.isFetching,
    error: statsQuery.error || activityQuery.error,
    refetch: () => {
      statsQuery.refetch();
      activityQuery.refetch();
    },
  };
}

// Re-export types for backward compatibility
export type { DashboardStats, RecentActivity };
