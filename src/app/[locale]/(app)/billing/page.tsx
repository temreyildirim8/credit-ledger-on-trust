'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Check,
  Star,
  Zap,
  Calendar,
  Download,
  ChevronRight,
  AlertCircle,
  Clock,
  Receipt,
} from 'lucide-react';
import { SubscriptionUpgradeModal } from '@/components/settings/SubscriptionUpgradeModal';

export default function BillingPage() {
  const t = useTranslations('billing');
  const tPricing = useTranslations('pricing');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Mock data - in production this would come from Supabase
  const currentPlan = {
    name: 'Free Forever',
    price: '$0',
    period: 'forever',
    customersUsed: 8,
    customersLimit: 50,
    renewalDate: null,
  };

  const paymentHistory = [
    { id: 1, date: '2026-01-15', amount: '$4.99', plan: 'Pro', status: 'paid' },
    { id: 2, date: '2025-12-15', amount: '$4.99', plan: 'Pro', status: 'paid' },
    { id: 3, date: '2025-11-15', amount: '$4.99', plan: 'Pro', status: 'paid' },
  ];

  const usagePercentage = (currentPlan.customersUsed / currentPlan.customersLimit) * 100;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent to-accent-hover rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-6 w-6 text-white/80" />
          <h1 className="text-2xl font-bold font-display">{t('title')}</h1>
        </div>
        <p className="text-white/90 text-sm">{t('subtitle')}</p>
      </div>

      {/* Current Plan Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-accent" />
              {t('currentPlan')}
            </CardTitle>
            <Badge className="bg-accent text-white">{t('active')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-xl text-text">{currentPlan.name}</p>
              <p className="text-sm text-text-secondary">
                {currentPlan.price}
                {currentPlan.period !== 'forever' && `/${currentPlan.period}`}
              </p>
            </div>
            <Button
              onClick={() => setUpgradeModalOpen(true)}
              className="bg-accent hover:bg-accent-hover"
            >
              <Zap className="h-4 w-4 mr-2" />
              {t('upgrade')}
            </Button>
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{t('customersUsed')}</span>
              <span className="font-medium text-text">
                {currentPlan.customersUsed} / {currentPlan.customersLimit}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            {usagePercentage >= 80 && (
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertCircle className="h-4 w-4" />
                <span>{t('approachingLimit')}</span>
              </div>
            )}
          </div>

          {/* Plan Features */}
          <div className="pt-3 border-t border-border">
            <p className="text-sm font-medium text-text mb-2">{t('planFeatures')}</p>
            <ul className="space-y-2">
              {tPricing.raw('free.features').map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-accent" />
            {t('billingSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-secondary">{t('nextBillingDate')}</span>
              <span className="font-medium text-text">{t('noUpcomingPayment')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-secondary">{t('paymentMethod')}</span>
              <span className="font-medium text-text">{t('noneAdded')}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">{t('billingCycle')}</span>
              <span className="font-medium text-text">{t('freePlan')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-accent" />
            {t('paymentHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">{t('noPaymentHistory')}</p>
              <p className="text-sm text-text-tertiary">{t('noPaymentHistoryDescription')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-surface-alt rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-text">{payment.plan}</p>
                      <p className="text-sm text-text-secondary flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {payment.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text">{payment.amount}</p>
                    <Badge variant="outline" className="text-success border-success">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
          <Download className="h-5 w-5 text-accent" />
          <span className="text-sm">{t('downloadInvoice')}</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          <span className="text-sm">{t('updatePayment')}</span>
        </Button>
      </div>

      {/* Upgrade CTA */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text">{t('upgradeCTATitle')}</p>
              <p className="text-sm text-text-secondary">{t('upgradeCTADescription')}</p>
            </div>
            <Button
              onClick={() => setUpgradeModalOpen(true)}
              className="bg-accent hover:bg-accent-hover"
            >
              {t('viewPlans')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Upgrade Modal */}
      <SubscriptionUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentPlan="free"
      />
    </div>
  );
}
