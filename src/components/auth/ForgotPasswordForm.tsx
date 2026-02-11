'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, MailCheck, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sendPasswordResetOTP, resetPasswordWithOTP } from '@/app/[locale]/(auth)/forgot-password/actions';

type FormState = 'idle' | 'otp-sent' | 'resetting' | 'success';

export function ForgotPasswordForm() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth.forgotPassword');
  const [isPending, startTransition] = useTransition();

  // Extract locale from pathname
  const segments = pathname.split('/');
  const locale = segments[1] || 'en';

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
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
        setFormState('otp-sent');
        toast.success(result.message || t('success'));
      }
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 8) {
      setError(t('otpVerification.invalidOtp'));
      toast.error(t('otpVerification.invalidOtp'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('otpVerification.passwordsMismatch'));
      toast.error(t('otpVerification.passwordsMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('otpVerification.passwordTooShort'));
      toast.error(t('otpVerification.passwordTooShort'));
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('otp', otp);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);

    startTransition(async () => {
      const result = await resetPasswordWithOTP(formData);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setFormState('success');
        toast.success(result.message || t('passwordReset.success'));

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 2000);
      }
    });
  };

  const isOtpSent = formState === 'otp-sent';
  const isSuccess = formState === 'success';

  return (
    <Card className="w-full max-w-md">
      {isSuccess ? (
        <>
          <CardHeader>
            <CardTitle>{t('passwordReset.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <MailCheck className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">{t('passwordReset.success')}</AlertTitle>
              <AlertDescription>
                {t('passwordReset.successDescription')}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push(`/${locale}/login`)}
              className="w-full"
            >
              {t('backToLogin')}
            </Button>
          </CardContent>
        </>
      ) : isOtpSent ? (
        <>
          <CardHeader>
            <CardTitle>{t('otpVerification.title')}</CardTitle>
            <CardDescription>
              {t('otpVerification.subtitle')}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp">{t('otpVerification.otp')}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder={t('otpVerification.otpPlaceholder')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  required
                  maxLength={8}
                  disabled={isPending}
                  autoFocus
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  {t('otpVerification.otpHint')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('otpVerification.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t('otpVerification.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('otpVerification.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('otpVerification.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isPending}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('otpVerification.submit')}
              </Button>
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormState('idle')}
                  disabled={isPending}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('otpVerification.back')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const formData = new FormData();
                    formData.append('email', email);
                    startTransition(async () => {
                      const result = await sendPasswordResetOTP(formData);
                      toast.success(result.message || t('otpVerification.resendSuccess'));
                    });
                  }}
                  disabled={isPending}
                  className="flex-1"
                >
                  {t('otpVerification.resend')}
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full"
              >
                {t('backToLogin')}
              </Button>
            </CardFooter>
          </form>
        </>
      ) : (
        <>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSendOtp}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <KeyRound className="mr-2 h-4 w-4" />
                {t('submit')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(`/${locale}/login`)}
                className="w-full"
              >
                {t('backToLogin')}
              </Button>
            </CardFooter>
          </form>
        </>
      )}
    </Card>
  );
}
