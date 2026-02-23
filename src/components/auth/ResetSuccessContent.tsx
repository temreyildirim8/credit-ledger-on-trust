'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MailCheck } from 'lucide-react';

export function ResetSuccessContent() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth.forgotPassword');
  const [countdown, setCountdown] = useState(5);

  // Extract locale from pathname directly (no useEffect needed)
  const locale = pathname.split('/')[1] || 'en';

  useEffect(() => {
    // Auto-redirect to login after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/${locale}/login`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, locale]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('passwordReset.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <MailCheck className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            {t('passwordReset.successDescription')}
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground text-center">
          Redirecting to login in {countdown} seconds...
        </p>
        <Button
          onClick={() => router.push(`/${locale}/login`)}
          className="w-full"
        >
          {t('backToLogin')}
        </Button>
      </CardContent>
    </Card>
  );
}
