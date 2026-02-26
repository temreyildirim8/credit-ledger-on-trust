'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Calendar, Filter, LayoutGrid, List, Search, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS, es, id, hi, ar } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useTranslations } from 'next-intl';
import type { Transaction } from '@/lib/services/transactions.service';

// Locale map for date-fns
const localeMap: Record<string, Locale> = { en: enUS, tr, es, id, hi, ar };

export default function TransactionsPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const dateLocale = localeMap[locale] || enUS;
  const t = useTranslations('transactions');

  const { transactions, loading, createTransaction, updateTransaction } = useTransactions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'debt' | 'payment'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">(
    typeof window !== "undefined" && window.innerWidth < 1024
      ? "cards"
      : "table",
  );

  const filteredTransactions = transactions.filter((t) => {
    // Type filter
    const matchesType = filter === 'all' ? true : t.type === filter;

    // Search filter
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesType;

    const matchesSearch =
      (t.customer_name?.toLowerCase().includes(q)) ||
      (t.description?.toLowerCase().includes(q)) ||
      (t.amount.toString().includes(q));

    return matchesType && matchesSearch;
  });

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] rounded-2xl p-6 text-white shadow-md dark:bg-none dark:p-0 dark:shadow-none dark:text-foreground">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">
              {t('title')}
            </h1>
            <p className="text-white/90 text-sm mt-1 dark:text-muted-foreground">
              {t('count', { count: transactions.length })}
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="gap-2 bg-white text-[var(--color-accent)] hover:bg-white/90 shadow-sm dark:bg-accent dark:text-white dark:hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            {t('addNew')}
          </Button>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

        {/* View Toggle — desktop only (lg and above) */}
        <div className="hidden lg:flex gap-1 border border-[var(--color-border)] rounded-lg p-1 ml-auto">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("table")}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("cards")}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">
            {searchQuery
              ? t('empty.noSearchResults')
              : filter === 'all'
                ? t('empty.noTransactions')
                : t('empty.noFilterResults').replace('{filter}', filter === 'debt' ? t('filter.debts') : t('filter.payments'))}
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* Desktop table view (lg and above) */
        <div className="hidden lg:block">
          <TransactionTable
            transactions={filteredTransactions}
            locale={locale}
            onEdit={handleEditTransaction}
          />
        </div>
      ) : null}

      {/* Card view: always on mobile/tablet (below lg), optional on desktop */}
      {!loading && filteredTransactions.length > 0 && (
        <div className={viewMode === "cards" ? "block" : "lg:hidden"}>
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
                        new Date(transaction.transaction_date || transaction.created_at || '1970-01-01'),
                        { addSuffix: true, locale: dateLocale }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === 'debt'
                          ? 'text-debt-text'
                          : 'text-payment-text'
                      }`}
                    >
                      {transaction.type === 'debt' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-text-secondary hover:text-text"
                      onClick={() => handleEditTransaction(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AddTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={createTransaction}
      />

      <EditTransactionModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={updateTransaction}
        transaction={selectedTransaction}
      />
    </div>
  );
}
