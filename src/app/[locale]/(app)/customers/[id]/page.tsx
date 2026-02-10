'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { customersService, Customer } from '@/lib/services/customers.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDistanceToNow } from 'date-fns';
import { tr, en, es } from 'date-fns/locale';

// Locale map for date-fns
const localeMap: Record<string, Locale> = { en, tr, es };

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'en';
  const dateLocale = localeMap[locale] || en;

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Customer not found</p>
      </div>
    );
  }

  const hasDebt = customer.balance > 0;

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
          <h1 className="text-2xl font-bold font-display">{customer.name}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 -mt-4">
        {/* Balance Card */}
        <Card className={hasDebt ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">
                {hasDebt ? 'Total Debt' : 'Balance'}
              </p>
              <p className={`text-3xl font-bold ${hasDebt ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(customer.balance))}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        {(customer.phone || customer.address) && (
          <Card className="border-[var(--color-border)]">
            <CardHeader>
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-[var(--color-accent)] hover:underline font-medium"
                  >
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.address && (
                <p className="text-sm text-[var(--color-text-secondary)]">{customer.address}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card className="border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-[var(--color-text-secondary)] py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]"
                  >
                    <div>
                      <Badge
                        className={transaction.type === 'debt'
                          ? 'mb-1 bg-red-100 text-red-700 hover:bg-red-200'
                          : 'mb-1 bg-green-100 text-green-700 hover:bg-green-200'}
                      >
                        {transaction.type === 'debt' ? 'Debt' : 'Payment'}
                      </Badge>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {formatDistanceToNow(
                          new Date(transaction.transaction_date),
                          { addSuffix: true, locale: dateLocale }
                        )}
                      </p>
                      {transaction.note && (
                        <p className="text-sm mt-1 text-[var(--color-text)]">{transaction.note}</p>
                      )}
                    </div>
                    <p
                      className={`font-semibold ${
                        transaction.type === 'debt'
                          ? 'text-red-600'
                          : 'text-green-600'
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
    </div>
  );
}
