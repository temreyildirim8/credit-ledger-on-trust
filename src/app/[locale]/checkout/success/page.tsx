'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Link } from '@/routing';

function CheckoutSuccessContent() {
  const t = useTranslations('checkout.success');
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Simulate verifying the session
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleGoToDashboard = () => {
    router.push(`/${locale}/dashboard`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-accent-hover">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-text-secondary">{t('verifying')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold font-display text-text mb-2">
              {t('errorTitle')}
            </h1>
            <p className="text-text-secondary mb-6">{error}</p>
            <Link href={`/${locale}/settings`}>
              <Button variant="outline">{t('backToSettings')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-accent-hover">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold font-display text-text mb-3">
            {t('title')}
          </h1>
          <p className="text-text-secondary mb-6">{t('description')}</p>

          <div className="bg-surface-alt rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="font-semibold text-text">{t('unlocked')}</span>
            </div>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>{t('features.unlimitedCustomers')}</li>
              <li>{t('features.smsReminders')}</li>
              <li>{t('features.advancedReports')}</li>
              <li>{t('features.prioritySupport')}</li>
            </ul>
          </div>

          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-accent hover:bg-accent-hover text-white"
          >
            {t('goToDashboard')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-accent-hover">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-8 pb-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
              <p className="text-white/80">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
