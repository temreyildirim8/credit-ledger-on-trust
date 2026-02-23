'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

// Free tier customer limit
const FREE_TIER_CUSTOMER_LIMIT = 10;

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: { name: string; phone?: string; address?: string; notes?: string }) => Promise<unknown>;
  currentCustomerCount?: number;
  isPaidPlan?: boolean;
}

export function AddCustomerModal({ open, onOpenChange, onSave, currentCustomerCount = 0, isPaidPlan = false }: AddCustomerModalProps) {
  const t = useTranslations('customers.form');
  const tCommon = useTranslations('common');
  const tCustomers = useTranslations('customers');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if customer limit is reached for free tier
  const isAtLimit = !isPaidPlan && currentCustomerCount >= FREE_TIER_CUSTOMER_LIMIT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check customer limit before saving
    if (isAtLimit) {
      toast.error(tCustomers('paywall.limitReached'));
      return;
    }

    if (!name.trim()) {
      toast.error(tCommon('required'));
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(tCustomers('success'));
      // Reset form
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || tCustomers('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>
              {tCustomers('title')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Paywall warning */}
            {isAtLimit && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800 text-sm">
                      {tCustomers('paywall.limitReached')}
                    </p>
                    <p className="text-orange-700 text-xs mt-1">
                      {tCustomers('paywall.upgradeMessage')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer count indicator */}
            {!isPaidPlan && (
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>{tCustomers('paywall.customersUsed', { count: currentCustomerCount })}</span>
                <span className={currentCustomerCount >= FREE_TIER_CUSTOMER_LIMIT ? 'text-orange-500 font-medium' : ''}>
                  {FREE_TIER_CUSTOMER_LIMIT} {tCustomers('paywall.limit')}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('addressPlaceholder')}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{tCommon('optional')}</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('addressPlaceholder')}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
