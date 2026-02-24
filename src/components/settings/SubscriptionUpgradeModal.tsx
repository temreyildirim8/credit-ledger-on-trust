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
import { Check, Star, Building2, Zap, X } from 'lucide-react';
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

type PlanKey = typeof plans[number]['key'];

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

    setIsLoading(true);
    try {
      // TODO: Connect to Stripe/payment provider
      // For now, simulate the upgrade process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (selectedPlan === 'enterprise') {
        toast.success(t('contactSalesSuccess'));
      } else {
        toast.success(t('upgradeSuccess', { plan: tPricing(`${selectedPlan}.name`) }));
      }

      onOpenChange(false);
      setSelectedPlan(null);
    } catch {
      toast.error(t('upgradeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentPlan = (planKey: PlanKey) => planKey === currentPlan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
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

                <CardContent className="pt-6 pb-4">
                  <div className="text-center mb-4">
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

                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold text-text">
                      {tPricing(`${plan.key}.price`)}
                    </span>
                    {plan.key !== 'enterprise' && (
                      <span className="text-text-secondary text-sm">
                        /{tPricing(`${plan.key}.period`)}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {Array.isArray(tPricing.raw(`${plan.key}.features`)) &&
                      tPricing.raw(`${plan.key}.features`).map((feature: string, index: number) => (
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
                <span className="animate-spin">...</span>
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
