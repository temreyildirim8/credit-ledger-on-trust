'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';

const plans = [
  { key: 'free' as const, icon: null, featured: false },
  { key: 'pro' as const, icon: Star, featured: true },
  { key: 'enterprise' as const, icon: Building2, featured: false },
];

export function PricingCards() {
  const t = useTranslations('pricing');

  return (
    <div className="grid md:grid-cols-3 gap-8 items-end">
      {plans.map((plan) => {
        const Icon = plan.icon;
        return (
          <Card
            key={plan.key}
            className={`border-2 flex flex-col ${
              plan.featured
                ? 'border-[var(--color-accent)] shadow-2xl relative z-10 md:scale-105 md:-my-4 bg-white dark:bg-gray-900'
                : 'border-[var(--color-border)]'
            }`}
          >
            {plan.featured && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-accent)]">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center pb-4">
              {Icon && (
                <div className="h-12 w-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                </div>
              )}
              <CardTitle className="font-display text-xl">
                {t(`${plan.key}.name`)}
              </CardTitle>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                {t(`${plan.key}.description`)}
              </p>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col flex-1">
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-[var(--color-text)]">
                  {t(`${plan.key}.price`)}
                </span>
                {plan.key !== 'enterprise' && (
                  <span className="text-[var(--color-text-secondary)]">
                    /{t(`${plan.key}.period`)}
                  </span>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {t.raw(`${plan.key}.features`).map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--color-text)] text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <CheckoutButton plan={plan.key} featured={plan.featured}>
                  {t(`${plan.key}.cta`)}
                </CheckoutButton>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
