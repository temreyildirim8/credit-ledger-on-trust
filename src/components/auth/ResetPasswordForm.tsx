'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authService } from '@/lib/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

type FormState = 'idle' | 'loading' | 'success' | 'checking';

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname
  const segments = pathname.split('/');
  const locale = segments[1] || 'en';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formState, setFormState] = useState<FormState>('checking');
  const [error, setError] = useState<string | null>(null);

  // Parse error from URL hash fragment
  const getErrorFromHash = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;

    const hash = window.location.hash;
    if (!hash || hash.length < 2) return null;

    const params = new URLSearchParams(hash.substring(1));
    const error = params.get('error');
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    if (error === 'access_denied') {
      switch (errorCode) {
        case 'otp_expired':
          return t('resetPassword.otpExpired') || 'Password reset link has expired. Please request a new reset link.';
        default:
          return errorDescription || t('resetPassword.invalidLink') || 'Invalid or expired link';
      }
    }

    return errorDescription || null;
  }, [t]);

  useEffect(() => {
    // First, check for error in URL hash
    const hashError = getErrorFromHash();
    if (hashError) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setError(hashError);
        setFormState('idle');
      });
      // Clear the hash to prevent error persisting on refresh
      window.history.replaceState(null, '', ' ');
      return;
    }

    // Check for valid session - Supabase automatically exchanges tokens from URL hash
    const checkSession = async () => {
      try {
        const session = await authService.getSession();
        if (!session) {
          setError('Geçersiz veya süresi dolmuş bağlantı');
          setFormState('idle');
        } else {
          setFormState('idle');
        }
      } catch {
        setError('Oturum doğrulanamadı');
        setFormState('idle');
      }
    };

    // Also listen for auth state changes to catch the recovery flow
    const { data: { subscription } } = authService.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'PASSWORD_RECOVERY') {
          setFormState('idle');
          setError(null);
        } else if (event === 'SIGNED_IN' && session) {
          setFormState('idle');
          setError(null);
        }
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [getErrorFromHash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordsMismatch'));
      toast.error(t('resetPassword.passwordsMismatch'));
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError(t('resetPassword.passwordTooShort'));
      toast.error(t('resetPassword.passwordTooShort'));
      return;
    }

    setFormState('loading');

    try {
      await authService.updatePassword(password);
      setFormState('success');
      toast.success(t('resetPassword.success'));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (error) {
      setFormState('idle');
      const errorMsg = (error instanceof Error ? error.message : String(error)) || t('resetPassword.error');
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const isLoading = formState === 'loading' || formState === 'checking';
  const isSuccess = formState === 'success';
  const hasError = error !== null;

  if (hasError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('resetPassword.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error') || 'Error'}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push(`/${locale}/forgot-password`)}
            className="w-full"
          >
            {t('resetPassword.requestNewLink') || 'Request New Reset Link'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}/login`)}
            className="w-full"
          >
            {t('resetPassword.backToLogin')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('resetPassword.title')}</CardTitle>
        <CardDescription>{t('resetPassword.subtitle')}</CardDescription>
      </CardHeader>

      {isSuccess ? (
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">{t('resetPassword.success')}</AlertTitle>
            <AlertDescription>
              {t('resetPassword.successDescription')}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push(`/${locale}/login`)}
            className="w-full"
          >
            {t('resetPassword.backToLogin')}
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('resetPassword.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('resetPassword.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('resetPassword.submit')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/${locale}/login`)}
              className="w-full"
            >
              {t('resetPassword.backToLogin')}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
