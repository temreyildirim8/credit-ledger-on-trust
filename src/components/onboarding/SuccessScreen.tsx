'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CardContent } from '@/components/ui/card';

// Dynamic import type for canvas-confetti
type ConfettiType = (options: Record<string, unknown>) => void;

export function SuccessScreen() {
  const t = useTranslations('onboarding');
  const [mounted, setMounted] = useState(false);

  const triggerConfetti = useCallback(async () => {
    // Dynamically import canvas-confetti only when needed
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default as ConfettiType;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  useEffect(() => {
    setMounted(true);

    // Trigger confetti on mount (only in browser)
    if (typeof window !== 'undefined') {
      triggerConfetti().catch(console.error);
    }
  }, [triggerConfetti]);

  return (
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
      {/* Success Icon */}
      <div className="mb-6 relative">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        {mounted && (
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
        )}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {t('success.title')}
      </h2>

      {/* Description */}
      <p className="text-muted-foreground mb-2">
        {t('success.subtitle')}
      </p>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('success.description')}
      </p>

      {/* Decorative Elements */}
      <div className="mt-8 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <div className="w-2 h-2 rounded-full bg-purple-400" />
      </div>
    </CardContent>
  );
}
