'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type FormState = 'idle' | 'loading' | 'success';

export function SignupForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const pathname = usePathname();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');

  // Extract locale from pathname
  const segments = pathname.split('/');
  const locale = segments[1] || 'en';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');

    try {
      await signUp(email, password, name);
      setFormState('success');
      toast.success(t('signup.success') || 'Account created successfully');
    } catch (error) {
      setFormState('idle');
      toast.error((error instanceof Error ? error.message : String(error)) || t('signup.error') || 'Failed to create account');
    }
  };

  const isLoading = formState === 'loading';
  const isSuccess = formState === 'success';

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('signup.title')}</CardTitle>
        <CardDescription>
          {t('signup.subtitle')}
        </CardDescription>
      </CardHeader>

      {isSuccess ? (
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">{t('signup.successTitle') || 'Registration Successful!'}</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{t('signup.successDescription1') || 'We have sent a verification link to your email address.'}</p>
              <p className="text-sm">{t('signup.successDescription2') || 'Please check your inbox (and spam folder), then click the link to verify your account.'}</p>
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push(`/${locale}/login`)}
            className="w-full"
          >
            {t('signup.goToLogin') || 'Go to Login Page'}
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('signup.name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('signup.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('signup.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('signup.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('signup.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('signup.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">{t('signup.passwordHint') || 'At least 6 characters'}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('signup.submit')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('signup.hasAccount')}{' '}
              <a href={`/${locale}/login`} className="text-primary hover:underline">
                {t('signup.signIn')}
              </a>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}