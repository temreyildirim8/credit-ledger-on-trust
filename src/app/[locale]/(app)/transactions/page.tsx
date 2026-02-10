'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDistanceToNow } from 'date-fns';
import { tr, en, es } from 'date-fns/locale';

// Locale map for date-fns
const localeMap: Record<string, Locale> = { en, tr, es };

export default function TransactionsPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const dateLocale = localeMap[locale] || en;

  const { transactions, loading, createTransaction } = useTransactions();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'debt' | 'payment'>('all');

  const filteredTransactions = transactions.filter((t) =>
    filter === 'all' ? true : t.type === filter
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] p-6 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display">Transactions</h1>
              <p className="text-white/80 mt-1">
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              className="gap-2 bg-white text-[var(--color-accent)] hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 -mt-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]' : ''}
          >
            All
          </Button>
          <Button
            variant={filter === 'debt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('debt')}
            className={filter === 'debt' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
          >
            Debts
          </Button>
          <Button
            variant={filter === 'payment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('payment')}
            className={filter === 'payment' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
          >
            Payments
          </Button>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-secondary)]">
              {filter === 'all' ? 'No transactions yet' : `No ${filter}s found`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className="p-4 border-[var(--color-border)] hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={transaction.type === 'debt'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'}
                      >
                        {transaction.type === 'debt' ? 'Debt' : 'Payment'}
                      </Badge>
                      <span className="font-medium text-[var(--color-text)]">{transaction.customer_name}</span>
                    </div>
                    {transaction.note && (
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        {transaction.note}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(
                        new Date(transaction.transaction_date),
                        { addSuffix: true, locale: dateLocale }
                      )}
                    </p>
                  </div>
                  <p
                    className={`text-lg font-semibold ${
                      transaction.type === 'debt'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {transaction.type === 'debt' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={createTransaction}
      />
    </div>
  );
}
