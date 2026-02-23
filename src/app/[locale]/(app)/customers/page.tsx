'use client';

import { useState } from 'react';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePathname } from '@/routing';
import { useTranslations } from 'next-intl';
import { Customer } from '@/lib/services/customers.service';

export default function CustomersPage() {
  const { customers, loading, createCustomer } = useCustomers();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hasDebt' | 'paidUp'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const t = useTranslations('customers');
  const tCommon = useTranslations('common');

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);

    if (filterType === 'hasDebt') return customer.balance > 0 && matchesSearch;
    if (filterType === 'paidUp') return customer.balance <= 0 && matchesSearch;
    return matchesSearch;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortColumn) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'balance':
        aValue = a.balance;
        bValue = b.balance;
        break;
      case 'last_transaction':
        aValue = a.last_transaction_date ? new Date(a.last_transaction_date).getTime() : 0;
        bValue = b.last_transaction_date ? new Date(b.last_transaction_date).getTime() : 0;
        break;
      case 'created_at':
      default:
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAddDebt = (customer: Customer) => {
    // TODO: Implement add debt modal
    console.log('Add debt for:', customer.name);
  };

  const handleRecordPayment = (customer: Customer) => {
    // TODO: Implement record payment modal
    console.log('Record payment for:', customer.name);
  };

  const handleEdit = (customer: Customer) => {
    // TODO: Implement edit customer modal
    console.log('Edit customer:', customer.name);
  };

  const handleArchive = (customer: Customer) => {
    // TODO: Implement archive customer (soft delete)
    console.log('Archive customer:', customer.name);
  };

  const handleDelete = (customer: Customer) => {
    // TODO: Implement delete customer (hard delete)
    console.log('Delete customer:', customer.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">{t('title')}</h1>
            <p className="text-white/90 mt-1">
              {t('count', { count: customers.length })}
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-white text-[var(--color-accent)] hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            {t('addCustomer')}
          </Button>
        </div>
      </div>

      {/* Search, Filters, and View Toggle */}
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
        <div className="flex gap-2 flex-wrap">
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
            className={filterType === 'hasDebt' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            {t('filter.hasDebt')}
          </Button>
          <Button
            variant={filterType === 'paidUp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('paidUp')}
            className={filterType === 'paidUp' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {t('filter.paidUp')}
          </Button>
        </div>
        {/* View Toggle */}
        <div className="flex gap-1 border border-[var(--color-border)] rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('table')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('cards')}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : sortedCustomers.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Plus className="h-8 w-8 text-[var(--color-accent)]" />
          </div>
          <p className="text-[var(--color-text-secondary)] text-lg font-medium">
            {searchQuery ? t('empty.noSearchResults') : t('empty.noCustomers')}
          </p>
          <p className="text-[var(--color-text-tertiary)] mt-2">
            {searchQuery
              ? 'Try a different search term'
              : 'Add your first customer to start tracking credit'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setModalOpen(true)}
              className="mt-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('empty.addFirst')}
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <CustomerTable
          customers={sortedCustomers}
          locale={locale}
          onAddDebt={handleAddDebt}
          onRecordPayment={handleRecordPayment}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDelete}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCustomers.map((customer) => (
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
