'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Phone,
  Mail,
  MapPin,
  Plus,
  Minus,
  Edit,
  Loader2,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react';
import { Customer, customersService } from '@/lib/services/customers.service';
import { userProfilesService } from '@/lib/services/user-profiles.service';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS, es, id, hi, ar } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { generateCustomerStatementPDF, downloadPDF } from '@/lib/utils/pdf-statement';
import { toast } from 'sonner';

// Locale map for date-fns
const localeMap: Record<string, Locale> = { en: enUS, tr, es, id, hi, ar };

interface Transaction {
  id: string;
  type: string;
  amount: number;
  transaction_date: string | null;
  created_at: string | null;
  description?: string | null;
}

interface CustomerDetailsModalProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDebt?: (customer: Customer) => void;
  onRecordPayment?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  locale?: string;
}

export function CustomerDetailsModal({
  customerId,
  open,
  onOpenChange,
  onAddDebt,
  onRecordPayment,
  onEdit,
  locale = 'en',
}: CustomerDetailsModalProps) {
  const { user } = useAuth();
  const t = useTranslations('customers');
  const dateLocale = localeMap[locale] || enUS;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [userCurrency, setUserCurrency] = useState<string>('TRY');

  useEffect(() => {
    if (!user?.id || !customerId || !open) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [customerData, transactionsData, userProfile] = await Promise.all([
          customersService.getCustomerById(user.id, customerId),
          customersService.getCustomerTransactions(user.id, customerId),
          userProfilesService.getProfile(user.id),
        ]);
        setCustomer(customerData);
        setTransactions(transactionsData);
        if (userProfile?.currency) {
          setUserCurrency(userProfile.currency);
        }
      } catch (error) {
        console.error('Error loading customer:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, customerId, open]);

  const hasDebt = customer ? customer.balance > 0 : false;

  const formatTransactionDate = (date: string | null | undefined) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale,
    });
  };

  const handleDownloadPDF = async () => {
    if (!customer) return;

    setGeneratingPDF(true);
    try {
      const pdfBytes = await generateCustomerStatementPDF({
        customer,
        transactions,
        businessInfo: {
          name: user?.user_metadata?.full_name || 'My Business',
          currency: userCurrency,
          language: locale,
        },
        locale,
      });

      // Generate filename with customer name and date
      const dateStr = new Date().toISOString().split('T')[0];
      const sanitizedName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `statement_${sanitizedName}_${dateStr}.pdf`;

      downloadPDF(pdfBytes, filename);
      toast.success(t('details.pdfDownloaded'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('details.pdfError'));
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          </div>
        ) : !customer ? (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-secondary)]">Customer not found</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0',
                    hasDebt ? 'bg-red-500' : 'bg-green-500'
                  )}
                >
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-xl">{customer.name}</DialogTitle>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {hasDebt ? 'Owes you money' : 'All settled up'}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Balance Card */}
              <Card
                className={cn(
                  'border-2',
                  hasDebt
                    ? 'border-red-200 bg-red-50'
                    : 'border-green-200 bg-green-50'
                )}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                      {hasDebt ? t('details.totalDebt') : t('details.balance')}
                    </p>
                    <p
                      className={cn(
                        'text-3xl font-bold',
                        hasDebt ? 'text-red-600' : 'text-green-600'
                      )}
                    >
                      {formatCurrency(Math.abs(customer.balance))}
                    </p>
                    {customer.transaction_count && customer.transaction_count > 0 && (
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                        {customer.transaction_count} transactions
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    onAddDebt?.(customer);
                    onOpenChange(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Debt
                </Button>
                <Button
                  onClick={() => {
                    onRecordPayment?.(customer);
                    onOpenChange(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>

              {/* PDF Statement Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
              >
                {generatingPDF ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {generatingPDF ? t('details.generatingPDF') : t('details.downloadPDF')}
              </Button>

              {/* Contact Info */}
              {(customer.phone || customer.address) && (
                <div className="space-y-3">
                  {customer.phone && (
                    <div className="flex items-center gap-3 p-3 bg-[var(--color-surface-alt)] rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-[var(--color-accent)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--color-text-tertiary)]">Phone</p>
                        <a
                          href={`tel:${customer.phone}`}
                          className="text-[var(--color-accent)] hover:underline font-medium"
                        >
                          {customer.phone}
                        </a>
                      </div>
                      <a
                        href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </Button>
                      </a>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-3 p-3 bg-[var(--color-surface-alt)] rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-tertiary)]">Address</p>
                        <p className="text-sm text-[var(--color-text)]">{customer.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--color-text)]">
                    {t('details.transactionHistory')}
                  </h3>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onEdit(customer);
                        onOpenChange(false);
                      }}
                      className="text-[var(--color-text-secondary)]"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>

                {transactions.length === 0 ? (
                  <p className="text-center text-[var(--color-text-secondary)] py-8">
                    {t('details.noTransactions')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              transaction.type === 'debt'
                                ? 'bg-red-100'
                                : 'bg-green-100'
                            )}
                          >
                            {transaction.type === 'debt' ? (
                              <TrendingUp className="h-5 w-5 text-red-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'font-medium',
                                  transaction.type === 'debt'
                                    ? 'border-red-200 text-red-700'
                                    : 'border-green-200 text-green-700'
                                )}
                              >
                                {transaction.type === 'debt'
                                  ? t('details.debt')
                                  : t('details.payment')}
                              </Badge>
                              <span className="text-xs text-[var(--color-text-tertiary)]">
                                {formatTransactionDate(
                                  transaction.transaction_date || transaction.created_at
                                )}
                              </span>
                            </div>
                            {transaction.description && (
                              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <p
                          className={cn(
                            'font-semibold text-lg',
                            transaction.type === 'debt'
                              ? 'text-red-600'
                              : 'text-green-600'
                          )}
                        >
                          {transaction.type === 'debt' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
