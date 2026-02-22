'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Calendar, Filter } from 'lucide-react';
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
    <div className="space-y-5">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-accent to-accent-hover rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">
              {t('title')}
            </h1>
            <p className="text-white/90 text-sm mt-1">
              {t('count', { count: transactions.length })}
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="gap-2 bg-white text-accent hover:bg-white/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {t('addNew')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-accent hover:bg-accent-hover' : 'hover:bg-surface-alt'}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          {t('filter.all')}
        </Button>
        <Button
          variant={filter === 'debt' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('debt')}
          className={filter === 'debt' ? 'bg-debt text-debt-text hover:opacity-90' : 'hover:bg-surface-alt'}
        >
          {t('filter.debts')}
        </Button>
        <Button
          variant={filter === 'payment' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('payment')}
          className={filter === 'payment' ? 'bg-payment text-payment-text hover:opacity-90' : 'hover:bg-surface-alt'}
        >
          {t('filter.payments')}
        </Button>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">
            {filter === 'all' ? t('empty.noTransactions') : t('empty.noFilterResults').replace('{filter}', filter === 'debt' ? t('filter.debts') : t('filter.payments'))}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      className={transaction.type === 'debt'
                        ? 'bg-debt text-debt-text'
                        : 'bg-payment text-payment-text'}
                    >
                      {transaction.type === 'debt' ? t('form.debt') : t('form.payment')}
                    </Badge>
                    <span className="font-medium text-text text-sm">
                      {transaction.customer_name}
                    </span>
                  </div>
                  {transaction.description && (
                    <p className="text-sm text-text-secondary mt-1">
                      {transaction.description}
                    </p>
                  )}
                  <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDistanceToNow(
                      new Date(transaction.transaction_date || transaction.created_at || Date.now()),
                      { addSuffix: true, locale: dateLocale }
                    )}
                  </p>
                </div>
                <p
                  className={`text-lg font-semibold flex-shrink-0 ${
                    transaction.type === 'debt'
                      ? 'text-debt-text'
                      : 'text-payment-text'
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

      <AddTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={createTransaction}
      />
    </div>
  );
}
