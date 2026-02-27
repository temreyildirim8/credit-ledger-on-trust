'use client';

import { Button } from '@/components/ui/button';
import { Users, Plus, FileText } from 'lucide-react';
import { Link } from '@/routing';
import { useTranslations } from 'next-intl';

interface DashboardEmptyStateProps {
  locale?: string;
}

export function DashboardEmptyState({ locale: _locale }: DashboardEmptyStateProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Illustration */}
      <div className="w-24 h-24 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center mb-6">
        <Users className="h-12 w-12 text-[var(--color-accent)]" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold font-display text-[var(--color-text)] text-center mb-2">
        {t('empty.title')}
      </h2>

      {/* Description */}
      <p className="text-[var(--color-text-secondary)] text-center max-w-md mb-8">
        {t('empty.description')}
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/customers">
          <Button
            size="lg"
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white gap-2"
          >
            <Plus className="h-5 w-5" />
            {t('empty.addCustomer')}
          </Button>
        </Link>
        <Link href="/reports">
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <FileText className="h-5 w-5" />
            {t('empty.viewReports')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
