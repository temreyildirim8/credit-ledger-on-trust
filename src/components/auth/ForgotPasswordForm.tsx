'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MailCheck, KeyRound, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sendPasswordResetOTP } from '@/app/[locale]/(auth)/forgot-password/actions';

export function ForgotPasswordForm() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth.forgotPassword');
  const [isPending, startTransition] = useTransition();

  // Extract locale from pathname
  const segments = pathname.split('/');
  const locale = segments[1] || 'en';

  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append('email', email);

    startTransition(async () => {
      const result = await sendPasswordResetOTP(formData);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setIsSuccess(true);
        toast.success(result.message || t('success'));
      }
    });
  };

  return (
    <Card className="w-full max-w-md">
      {isSuccess ? (
        <>
          <CardHeader>
            <CardTitle>{t('emailSent.title') || 'Check Your Email'}</CardTitle>
            <CardDescription>
              {t('emailSent.subtitle') || 'We\'ve sent a password reset link to your email address.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <MailCheck className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {t('emailSent.description') || `If an account exists for ${email}, you will receive a password reset link shortly. Click the link in the email to reset your password.`}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push(`/${locale}/login`)}
              className="w-full"
            >
              {t('backToLogin') || 'Back to Login'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
              }}
              className="w-full"
            >
              {t('tryAnotherEmail') || 'Try another email'}
            </Button>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle>{t('title') || 'Forgot Password'}</CardTitle>
            <CardDescription>{t('subtitle') || 'Enter your email address and we\'ll send you a link to reset your password.'}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('email') || 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder') || 'Enter your email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                  autoFocus
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <KeyRound className="mr-2 h-4 w-4" />
                {t('submit') || 'Send Reset Link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full"
              >
                {t('backToLogin') || 'Back to Login'}
              </Button>
            </CardFooter>
          </form>
        </>
      )}
    </Card>
  );
}
