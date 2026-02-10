'use client';

import { useDashboard } from '@/lib/hooks/useDashboard';
import { Loader2 } from 'lucide-react';
import { QuickStatsGrid } from '@/components/dashboard/QuickStatsGrid';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { OverdueDebts } from '@/components/dashboard/OverdueDebts';
import { usePathname } from '@/routing';

export default function DashboardPage() {
  const { stats, recentActivity, loading } = useDashboard();
  const pathname = usePathname();

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'en';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  // Sample overdue data (would come from API)
  const overdueCustomers = [
    // Add overdue customers here
  ];

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold font-display">
          Good morning! 👋
        </h1>
        <p className="text-white/90 mt-1">
          Here's your business overview for today
        </p>
      </div>

      {/* Quick Stats Grid */}
      <QuickStatsGrid
        totalDebt={stats?.totalDebt}
        totalCollected={stats?.totalCollected}
        activeCustomers={stats?.activeCustomers}
        thisMonth={stats?.thisMonth}
      />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          Quick Actions
        </h2>
        <QuickActions locale={locale} />
      </div>

      {/* Overdue Debts */}
      <OverdueDebts customers={overdueCustomers} locale={locale} />

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          Recent Activity
        </h2>
        <RecentActivity activities={recentActivity} locale={locale} />
      </div>
    </div>
  );
}
