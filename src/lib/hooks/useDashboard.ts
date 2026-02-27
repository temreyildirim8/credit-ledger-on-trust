"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  dashboardService,
  DashboardStats,
  RecentActivity,
} from "@/lib/services/dashboard.service";

export function useDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // API routes validate JWT server-side, no need to pass userId
        const [statsData, activityData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivity(),
        ]);
        setStats(statsData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  return { stats, recentActivity, loading };
}
