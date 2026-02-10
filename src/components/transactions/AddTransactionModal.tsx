'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { transactionsService } from '@/lib/services/transactions.service';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: {
    customerId: string;
    type: 'debt' | 'payment';
    amount: number;
    note?: string;
  }) => Promise<void>;
}

interface Customer {
  id: string;
  name: string;
}

export function AddTransactionModal({ open, onOpenChange, onSave }: AddTransactionModalProps) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [type, setType] = useState<'debt' | 'payment'>('debt');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      loadCustomers();
    }
  }, [open, user?.id]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const data = await transactionsService.getCustomers(user!.id);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount) {
      toast.error('Customer and amount are required');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        customerId,
        type,
        amount: amountNum,
        note: note.trim() || undefined,
      });
      toast.success('Transaction added!');
      // Reset form
      setType('debt');
      setCustomerId('');
      setAmount('');
      setNote('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display font-semibold">New Transaction</DialogTitle>
            <DialogDescription>
              Add a debt or payment transaction
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
                Debt
              </Button>
              <Button
                type="button"
                variant={type === 'payment' ? 'default' : 'outline'}
                className={cn("flex-1", type === 'payment' ? 'bg-green-500 hover:bg-green-600 text-white' : '')}
                onClick={() => setType('payment')}
                disabled={loading}
              >
                Payment
              </Button>
            </div>

            {/* Customer Select */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={customerId}
                onValueChange={setCustomerId}
                disabled={loading || loadingCustomers}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
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
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Description (optional)"
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
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
