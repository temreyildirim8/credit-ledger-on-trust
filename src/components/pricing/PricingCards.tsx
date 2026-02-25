'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/pricing/CheckoutButton';

type BillingInterval = 'monthly' | 'yearly';
type PlanKey = 'free' | 'pro' | 'enterprise';

interface PriceInfo {
  price: string;
  period: string;
  savings?: string;
}

const plans: Array<{ key: PlanKey; icon: React.ComponentType<{ className?: string }> | null; featured: boolean }> = [
  { key: 'free', icon: null, featured: false },
  { key: 'pro', icon: Star, featured: true },
  { key: 'enterprise', icon: Building2, featured: false },
];

// Pricing data for monthly and yearly billing
const pricingData: Record<PlanKey, Record<BillingInterval, PriceInfo>> = {
  free: {
    monthly: { price: '$0', period: 'forever' },
    yearly: { price: '$0', period: 'forever' },
  },
  pro: {
    monthly: { price: '$4.99', period: 'month' },
    yearly: { price: '$49', period: 'year', savings: 'Save 17%' },
  },
  enterprise: {
    monthly: { price: 'Custom', period: 'contact' },
    yearly: { price: 'Custom', period: 'contact' },
  },
};

export function PricingCards() {
  const t = useTranslations('pricing');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  return (
    <div>
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span
          className={`text-sm font-medium transition-colors ${
            billingInterval === 'monthly'
              ? 'text-[var(--color-text)]'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          {t('monthly')}
        </span>
        <button
          onClick={() => setBillingInterval(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
          style={{
            backgroundColor: billingInterval === 'yearly' ? 'var(--color-accent)' : 'var(--color-border)',
          }}
          aria-label={t('toggleBilling')}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${
            billingInterval === 'yearly'
              ? 'text-[var(--color-text)]'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          {t('yearly')}
        </span>
        {billingInterval === 'yearly' && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            {t('save17')}
          </Badge>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 items-end">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const priceInfo = pricingData[plan.key][billingInterval];

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
                  {t('mostPopular')}
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
                    {priceInfo.price}
                  </span>
                  {plan.key !== 'enterprise' && (
                    <span className="text-[var(--color-text-secondary)]">
                      /{priceInfo.period}
                    </span>
                  )}
                  {/* Always show "Save 17%" badge on PRO card (yearly savings) */}
                  {plan.key === 'pro' && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                        {t('save17')}
                      </Badge>
                    </div>
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
                  <CheckoutButton plan={plan.key} featured={plan.featured} interval={billingInterval}>
                    {t(`${plan.key}.cta`)}
                  </CheckoutButton>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
