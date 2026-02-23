'use client';

import { useDashboard } from '@/lib/hooks/useDashboard';
import { Loader2, ArrowUpRight, Plus } from 'lucide-react';
import { QuickStatsGrid } from '@/components/dashboard/QuickStatsGrid';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { OverdueDebts } from '@/components/dashboard/OverdueDebts';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { QuickTour } from '@/components/onboarding/QuickTour';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { stats, recentActivity, loading } = useDashboard();
  const pathname = usePathname();

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'en';

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Show empty state if no customers
  const hasCustomers = stats && stats.activeCustomers > 0;

  if (!hasCustomers) {
    return <DashboardEmptyState locale={locale} />;
  }

  // Sample overdue data (would come from API)
  const overdueCustomers: { id: string; name: string; amount: number; overdueDays: number }[] = [];

  return (
    <div className="space-y-5">
      {/* Quick Tour - Desktop only */}
      <QuickTour />

      {/* Greeting Header - Refined Card */}
      <div className="bg-gradient-to-br from-accent to-accent-hover rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display mb-1">
              {getGreeting()} 👋
            </h1>
            <p className="text-white/90 text-sm">
              {t('stats.totalOwed')} • {t('stats.thisMonth')}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            data-tour="quick-add-button"
          >
            <Plus className="h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div data-tour="quick-stats">
        <QuickStatsGrid
          totalDebt={stats?.totalDebt}
          totalCollected={stats?.totalCollected}
          activeCustomers={stats?.activeCustomers}
        />
      </div>

      {/* Quick Actions - Redesigned */}
      <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm" data-tour="quick-actions">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">
            {t('quickActions.title')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-accent hover:text-accent-hover"
          >
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        <QuickActions locale={locale} />
      </div>

      {/* Overdue Debts */}
      <OverdueDebts customers={overdueCustomers} locale={locale} />

      {/* Recent Activity */}
      <div data-tour="recent-activity">
        <h2 className="text-lg font-semibold text-text mb-4">
          {t('recentActivity.title')}
        </h2>
        <RecentActivity activities={recentActivity} locale={locale} />
      </div>
    </div>
  );
}
