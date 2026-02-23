'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Customer } from '@/lib/services/customers.service';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS, es, id, hi, ar } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { Phone, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';

// Locale map for date-fns
const localeMap: Record<string, Locale> = { en: enUS, tr, es, id, hi, ar };

interface CustomerTableProps {
  customers: Customer[];
  locale?: string;
  onAddDebt?: (customer: Customer) => void;
  onRecordPayment?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onArchive?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export function CustomerTable({
  customers,
  locale = 'en',
  onAddDebt,
  onRecordPayment,
  onEdit,
  onArchive,
  onDelete,
  sortColumn,
  sortDirection,
  onSort,
}: CustomerTableProps) {
  const t = useTranslations('customers');
  const dateLocale = localeMap[locale] || enUS;

  const getStatusBadge = (balance: number) => {
    if (balance > 0) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">
          {t('filter.hasDebt')}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
        {t('filter.paidUp')}
      </Badge>
    );
  };

  const getAvatarColor = (balance: number) => {
    return balance > 0 ? 'bg-red-500' : 'bg-green-500';
  };

  const formatLastTransaction = (date: string | null | undefined) => {
    if (!date) return '-';
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale,
    });
  };

  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  const SortButton = ({ column, label }: { column: string; label: string }) => (
    <button
      className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors"
      onClick={() => handleSort(column)}
    >
      {label}
      <ArrowUpDown className="h-4 w-4 opacity-50" />
    </button>
  );

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[300px] font-semibold text-[var(--color-text-secondary)]">
              <SortButton column="name" label={t('form.name')} />
            </TableHead>
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              {t('form.phone')}
            </TableHead>
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              <SortButton column="balance" label={t('details.balance')} />
            </TableHead>
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              {t('details.contact')}
            </TableHead>
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              Last Activity
            </TableHead>
            <TableHead className="w-[60px] text-right font-semibold text-[var(--color-text-secondary)]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className="cursor-pointer group"
              onClick={() => window.location.href = `/${locale}/app/customers/${customer.id}`}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0',
                      getAvatarColor(customer.balance)
                    )}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">
                      {customer.name}
                    </p>
                    {customer.transaction_count && customer.transaction_count > 0 && (
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {customer.transaction_count} transactions
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {customer.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                    <span className="text-[var(--color-text-secondary)]">{customer.phone}</span>
                  </div>
                ) : (
                  <span className="text-[var(--color-text-tertiary)]">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-semibold',
                      customer.balance > 0
                        ? 'text-[var(--color-debt-text,#EF4444)]'
                        : 'text-[var(--color-payment-text,#10B981)]'
                    )}
                  >
                    {customer.balance > 0 ? '+' : ''}
                    {formatCurrency(Math.abs(customer.balance))}
                  </span>
                  {getStatusBadge(customer.balance)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {customer.phone && (
                    <a
                      href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 hover:text-green-700 transition-colors"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </Button>
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {formatLastTransaction(customer.last_transaction_date)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onAddDebt && (
                      <DropdownMenuItem onClick={() => onAddDebt(customer)}>
                        Add Debt
                      </DropdownMenuItem>
                    )}
                    {onRecordPayment && (
                      <DropdownMenuItem onClick={() => onRecordPayment(customer)}>
                        Record Payment
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(customer)}>
                          Edit Customer
                        </DropdownMenuItem>
                      </>
                    )}
                    {onArchive && (
                      <DropdownMenuItem
                        onClick={() => onArchive(customer)}
                        className="text-orange-600"
                      >
                        Archive
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(customer)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
