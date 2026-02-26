'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { transactionsService, Transaction } from '@/lib/services/transactions.service';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface EditTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transactionId: string, transaction: {
    customerId?: string;
    type?: 'debt' | 'payment';
    amount?: number;
    note?: string;
    date?: string;
  }) => Promise<unknown>;
  transaction: Transaction | null;
}

interface Customer {
  id: string;
  name: string;
}

export function EditTransactionModal({
  open,
  onOpenChange,
  onSave,
  transaction,
}: EditTransactionModalProps) {
  const { user } = useAuth();
  const t = useTranslations('transactions.form');
  const tCommon = useTranslations('common');
  const tTransactions = useTranslations('transactions');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [type, setType] = useState<'debt' | 'payment'>('debt');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Load customers when modal opens
  useEffect(() => {
    if (!open || !user?.id) return;

    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const data = await transactionsService.getCustomers(user.id);
        setCustomers(data);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [open, user?.id]);

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCustomerId(transaction.customer_id);
      setAmount(transaction.amount.toString());
      setNote(transaction.description || '');
      // Format date for input (YYYY-MM-DD)
      if (transaction.transaction_date) {
        const d = new Date(transaction.transaction_date);
        setDate(d.toISOString().split('T')[0]);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !amount) {
      toast.error(tTransactions.raw('validation.invalidAmount') || 'Amount is required');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(tTransactions.raw('validation.invalidAmount') || 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const updateData: {
        customerId?: string;
        type?: 'debt' | 'payment';
        amount?: number;
        note?: string;
        date?: string;
      } = {
        type,
        amount: amountNum,
        note: note.trim() || undefined,
      };

      // Only include customerId if it changed (to avoid unnecessary updates)
      if (customerId !== transaction.customer_id) {
        updateData.customerId = customerId;
      }

      // Include date if provided
      if (date) {
        updateData.date = new Date(date).toISOString();
      }

      await onSave(transaction.id, updateData);
      toast.success(tTransactions.raw('editSuccess') || 'Transaction updated');
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || tTransactions.raw('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display font-semibold">{t('editTitle')}</DialogTitle>
            <DialogDescription>
              {t('editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'debt' ? 'default' : 'outline'}
                className={cn("flex-1", type === 'debt' ? 'bg-red-500 hover:bg-red-600 text-white' : '')}
                onClick={() => setType('debt')}
                disabled={loading}
              >
                {t('debt')}
              </Button>
              <Button
                type="button"
                variant={type === 'payment' ? 'default' : 'outline'}
                className={cn("flex-1", type === 'payment' ? 'bg-green-500 hover:bg-green-600 text-white' : '')}
                onClick={() => setType('payment')}
                disabled={loading}
              >
                {t('payment')}
              </Button>
            </div>

            {/* Customer Select */}
            <div className="space-y-2">
              <Label htmlFor="edit-customer">{t('customer')}</Label>
              <Select
                value={customerId}
                onValueChange={setCustomerId}
                disabled={loading || loadingCustomers}
              >
                <SelectTrigger>
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
              <Label htmlFor="edit-amount">{t('amount')} *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('amountPlaceholder')}
                disabled={loading}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-date">{t('date')}</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="edit-note">{t('note')}</Label>
              <Input
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('notePlaceholder')}
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
            <Button type="submit" disabled={loading} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
