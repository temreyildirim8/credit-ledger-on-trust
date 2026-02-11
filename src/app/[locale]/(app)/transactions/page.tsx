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
import { tr, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useTranslations } from 'next-intl';

// Locale map for date-fns
const localeMap: Record<string, Locale> = { en: enUS, tr, es };

export default function TransactionsPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const dateLocale = localeMap[locale] || enUS;
  const t = useTranslations('transactions');

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
              <h1 className="text-2xl font-bold font-display">{t('title')}</h1>
              <p className="text-white/80 mt-1">
                {transactions.length} {transactions.length === 1 ? t('count').split('|')[0].replace('{count}', String(transactions.length)) : t('count').split('|')[1].replace('{count}', String(transactions.length))}
              </p>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              className="gap-2 bg-white text-[var(--color-accent)] hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              {t('addNew')}
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
            {t('filter.all')}
          </Button>
          <Button
            variant={filter === 'debt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('debt')}
            className={filter === 'debt' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
          >
            {t('filter.debts')}
          </Button>
          <Button
            variant={filter === 'payment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('payment')}
            className={filter === 'payment' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
          >
            {t('filter.payments')}
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
              {filter === 'all' ? t('empty.noTransactions') : t('empty.noFilterResults').replace('{filter}', filter === 'debt' ? t('filter.debts') : t('filter.payments'))}
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
                        {transaction.type === 'debt' ? t('form.debt') : t('form.payment')}
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
