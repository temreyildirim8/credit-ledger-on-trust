'use client';

import { useState } from 'react';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePathname } from '@/routing';
import { useTranslations } from 'next-intl';

export default function CustomersPage() {
  const { customers, loading, createCustomer } = useCustomers();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hasDebt' | 'paidUp'>('all');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const t = useTranslations('customers');
  const tCommon = useTranslations('common');

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);

    if (filterType === 'hasDebt') return customer.balance > 0;
    if (filterType === 'paidUp') return customer.balance <= 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">{t('title')}</h1>
            <p className="text-white/90 mt-1">
              {customers.length} {customers.length === 1 ? t('count').split('|')[0].replace('{count}', String(customers.length)) : t('count').split('|')[1].replace('{count}', String(customers.length))}
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-white text-[var(--var(--color-accent))] hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            {t('addCustomer')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            {t('filter.all')}
          </Button>
          <Button
            variant={filterType === 'hasDebt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('hasDebt')}
          >
            {t('filter.hasDebt')}
          </Button>
          <Button
            variant={filterType === 'paidUp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('paidUp')}
          >
            {t('filter.paidUp')}
          </Button>
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-text-secondary)]">
            {searchQuery ? t('empty.noSearchResults') : t('empty.noCustomers')}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setModalOpen(true)}
              variant="outline"
              className="mt-4"
            >
              {t('empty.addFirst')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} locale={locale} />
          ))}
        </div>
      )}

      <AddCustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={createCustomer}
      />
    </div>
  );
}
