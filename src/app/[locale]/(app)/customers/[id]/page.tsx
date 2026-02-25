'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { customersService, Customer } from '@/lib/services/customers.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Loader2, Mail, MapPin, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useTranslations } from 'next-intl';

// Locale map for date-fns
const localeMap: Record<string, Locale> = { en: enUS, tr, es };

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations('customers');
  const tCommon = useTranslations('common');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<{ id: string; type: string; amount: number; transaction_date: string | null; created_at: string | null; description?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'en';
  const dateLocale = localeMap[locale] || enUS;

  useEffect(() => {
    if (!user?.id || !params.id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [customerData, transactionsData] = await Promise.all([
          customersService.getCustomerById(user.id, params.id as string),
          customersService.getCustomerTransactions(user.id, params.id as string),
        ]);
        setCustomer(customerData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error loading customer:', error);
        router.push('/customers');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, params.id, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-text-secondary">{t('details.notFound')}</p>
      </div>
    );
  }

  const hasDebt = customer.balance > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent to-accent-hover rounded-2xl p-6 text-white shadow-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-2 text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
        <h1 className="text-2xl font-bold font-display">{customer.name}</h1>
        <p className="text-white/90 text-sm mt-1">
          {hasDebt ? t('details.owesYou') : t('details.settledUp')}
        </p>
      </div>

      {/* Balance Card */}
      <Card className={hasDebt ? 'border-debt/20 bg-debt/5' : 'border-payment/20 bg-payment/5'}>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-text-secondary mb-2">
              {hasDebt ? t('details.totalDebt') : t('details.balance')}
            </p>
            <p className={`text-3xl font-bold ${hasDebt ? 'text-debt-text' : 'text-payment-text'}`}>
              {formatCurrency(Math.abs(customer.balance))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="default"
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              {t('details.call')}
            </Button>
            <Button
              variant="outline"
              size="default"
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      {(customer.phone || customer.address) && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">{t('details.contact')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <a
                  href={`tel:${customer.phone}`}
                  className="text-accent hover:underline font-medium"
                >
                  {customer.phone}
                </a>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm text-text-secondary">{customer.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('details.transactionHistory')}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {t('details.editCustomer')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-text-secondary py-8">
              {t('details.noTransactions')}
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-surface-alt rounded-xl border border-border transition-shadow hover:shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={transaction.type === 'debt'
                          ? 'bg-debt text-debt-text'
                          : 'bg-payment text-payment-text'}
                      >
                        {transaction.type === 'debt' ? 'Debt' : 'Payment'}
                      </Badge>
                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                        {formatDistanceToNow(
                          new Date(transaction.transaction_date || transaction.created_at || Date.now()),
                          { addSuffix: true, locale: dateLocale }
                        )}
                      </p>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-text">{transaction.description}</p>
                    )}
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
