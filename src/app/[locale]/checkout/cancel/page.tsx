'use client';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Link } from '@/routing';

function CheckoutCancelContent() {
  const t = useTranslations('checkout.cancel');
  const locale = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-warning" />
          </div>
          <h1 className="text-3xl font-bold font-display text-text mb-3">
            {t('title')}
          </h1>
          <p className="text-text-secondary mb-6">{t('description')}</p>

          <div className="bg-surface-alt rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-text-secondary">{t('helpText')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href={`/${locale}/settings`} className="w-full">
              <Button className="w-full bg-accent hover:bg-accent-hover text-white">
                {t('tryAgain')}
              </Button>
            </Link>
            <Link href={`/${locale}/pricing`} className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToPricing')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-text-secondary">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <CheckoutCancelContent />
    </Suspense>
  );
}
