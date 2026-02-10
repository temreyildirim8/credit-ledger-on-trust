'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function QuickAddPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const { createTransaction } = useTransactions();
  const { customers } = useCustomers();
  const [type, setType] = useState<'debt' | 'payment'>('debt');
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

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
      await createTransaction({
        customerId,
        type,
        amount: amountNum,
        note: note.trim() || undefined,
      });
      toast.success('Transaction added!');
      router.back();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [10, 50, 100, 200, 500];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] p-6 text-white">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Quick Add
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 -mt-4">
        <Card className="border-[var(--color-border)]">
          <CardHeader className="border-b border-[var(--color-border)]">
            <CardTitle className="font-display">New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === 'debt' ? 'default' : 'outline'}
                  className={cn("flex-1 h-12 text-lg", type === 'debt' ? 'bg-red-500 hover:bg-red-600 text-white' : '')}
                  onClick={() => setType('debt')}
                  disabled={loading}
                >
                  Debt
                </Button>
                <Button
                  type="button"
                  variant={type === 'payment' ? 'default' : 'outline'}
                  className={cn("flex-1 h-12 text-lg", type === 'payment' ? 'bg-green-500 hover:bg-green-600 text-white' : '')}
                  onClick={() => setType('payment')}
                  disabled={loading}
                >
                  Payment
                </Button>
              </div>

              {/* Customer Select */}
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId} disabled={loading}>
                  <SelectTrigger className="h-12">
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
                <Label>Amount *</Label>
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
                <Label>Note</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Description (optional)"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {type === 'debt' ? 'Add Debt' : 'Add Payment'}
                {amount && ` - ${parseFloat(amount).toFixed(2)}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
