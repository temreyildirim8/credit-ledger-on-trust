'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function QuickAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('quickAdd');
  const tCommon = useTranslations('common');

  const { createTransaction } = useTransactions();
  const { customers } = useCustomers();
  const [type, setType] = useState<'debt' | 'payment'>('debt');

  // Read type from URL query param
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'debt' || typeParam === 'payment') {
      setType(typeParam);
    }
  }, [searchParams]);
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount) {
      toast.error(tCommon('required'));
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t('validation.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      await createTransaction({
        customerId,
        type,
        amount: amountNum,
        note: note.trim() || undefined,
      });
      toast.success(t('success'));
      router.back();
    } catch (error) {
      toast.error((error instanceof Error ? error.message : String(error)) || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [10, 50, 100, 200, 500];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] rounded-2xl p-6 text-white dark:bg-none dark:p-0 dark:text-foreground">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Plus className="h-6 w-6" />
          {t('title')}
        </h1>
      </div>

      {/* Form Card */}
      <Card className="border-border bg-surface">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-display text-text">{t('newTransaction')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'debt' ? 'default' : 'outline'}
                className={cn("flex-1 h-12 text-lg", type === 'debt' ? 'bg-destructive hover:bg-destructive/90 text-white' : '')}
                onClick={() => setType('debt')}
                disabled={loading}
              >
                {t('type.debt')}
              </Button>
              <Button
                type="button"
                variant={type === 'payment' ? 'default' : 'outline'}
                className={cn("flex-1 h-12 text-lg", type === 'payment' ? 'bg-green-600 hover:bg-green-700 text-white' : '')}
                onClick={() => setType('payment')}
                disabled={loading}
              >
                {t('type.payment')}
              </Button>
            </div>

            {/* Customer Select */}
            <div className="space-y-2">
              <Label className="text-text">{t('customer')} *</Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={loading}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t('customerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-text">{t('amount')} *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 text-lg"
                disabled={loading}
              />
              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {quickAmounts.map((qa) => (
                  <Button
                    key={qa}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(qa.toString())}
                    disabled={loading}
                  >
                    +{qa}
                  </Button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label className="text-text">{t('note')}</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('notePlaceholder')}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-lg bg-accent hover:bg-accent-hover text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {type === 'debt' ? t('submit.debt') : t('submit.payment')}
              {amount && ` - ${parseFloat(amount).toFixed(2)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
