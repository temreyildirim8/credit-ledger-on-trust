'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { dashboardService, DashboardStats, RecentActivity } from '@/lib/services/dashboard.service';

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
        const [statsData, activityData] = await Promise.all([
          dashboardService.getStats(user.id),
          dashboardService.getRecentActivity(user.id),
        ]);
        setStats(statsData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  return { stats, recentActivity, loading };
}
