'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Star, Building2, Zap, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: 'free' | 'basic' | 'pro' | 'enterprise';
}

const plans = [
  { key: 'free', icon: null, featured: false },
  { key: 'pro', icon: Star, featured: true },
  { key: 'enterprise', icon: Building2, featured: false },
] as const;

type PlanKey = (typeof plans)[number]['key'];

export function SubscriptionUpgradeModal({
  open,
  onOpenChange,
  currentPlan = 'free',
}: SubscriptionUpgradeModalProps) {
  const t = useTranslations('settings.sections.upgradeModal');
  const tPricing = useTranslations('pricing');
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = (planKey: PlanKey) => {
    if (planKey === currentPlan) return;
    setSelectedPlan(planKey);
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    // Enterprise plan should contact sales
    if (selectedPlan === 'enterprise') {
      toast.success(t('contactSalesSuccess'));
      onOpenChange(false);
      setSelectedPlan(null);
      return;
    }

    // Free plan should not trigger checkout
    if (selectedPlan === 'free') {
      toast.info(t('alreadyOnFree', { defaultValue: 'You are already on the Free plan.' }));
      return;
    }

    setIsLoading(true);
    try {
      // Call the Stripe checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          interval: 'monthly',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t('upgradeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentPlan = (planKey: PlanKey) => planKey === currentPlan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.key;
            const isCurrent = isCurrentPlan(plan.key);

            return (
              <Card
                key={plan.key}
                className={`relative cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-success bg-success/5'
                    : isSelected
                      ? 'border-accent ring-2 ring-accent/20'
                      : plan.featured
                        ? 'border-accent/50 hover:border-accent'
                        : 'border-border hover:border-accent/30'
                }`}
                onClick={() => handleSelectPlan(plan.key)}
              >
                {plan.featured && !isCurrent && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-white">
                    {t('mostPopular')}
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-success text-white">
                    {t('currentPlan')}
                  </Badge>
                )}

                <CardContent className="pt-6 pb-4 px-5">
                  <div className="text-center mb-5">
                    {Icon && (
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                        <Icon className="h-5 w-5 text-accent" />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg font-display">
                      {tPricing(`${plan.key}.name`)}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {tPricing(`${plan.key}.description`)}
                    </p>
                  </div>

                  <div className="text-center mb-5">
                    <span className="text-3xl font-bold text-text">
                      {tPricing(`${plan.key}.price`)}
                    </span>
                    {plan.key !== 'enterprise' && (
                      <span className="text-text-secondary text-sm">
                        /{tPricing(`${plan.key}.period`)}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-4">
                    {Array.isArray(tPricing.raw(`${plan.key}.features`)) &&
                      tPricing
                        .raw(`${plan.key}.features`)
                        .map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-text">{feature}</span>
                          </li>
                        ))}
                  </ul>

                  {isCurrent && (
                    <div className="flex items-center justify-center gap-2 text-success text-sm font-medium">
                      <Check className="h-4 w-4" />
                      {t('currentPlanActive')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {t('cancel')}
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedPlan || isCurrentPlan(selectedPlan) || isLoading}
            className="sm:flex-2 bg-accent hover:bg-accent-hover"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('processing')}
              </span>
            ) : selectedPlan === 'enterprise' ? (
              t('contactSales')
            ) : (
              t('upgradeTo', { plan: selectedPlan ? tPricing(`${selectedPlan}.name`) : '' })
            )}
          </Button>
        </div>

        <p className="text-xs text-text-secondary text-center mt-2">
          {t('footerNote')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
