'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Download,
  ArrowRight,
  PieChart,
  Calendar,
  Loader2,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { userProfilesService, type UserProfile as ServiceUserProfile } from '@/lib/services/user-profiles.service';
import { generateTransactionsCSV, downloadCSV, generateCSVFilename } from '@/lib/utils/csv-export';
import {
  generateShopReportPDF,
  generateCustomerStatementPDF,
  downloadPDF,
  type ShopReportData,
} from '@/lib/utils/pdf-statement';
import type { Transaction } from '@/lib/services/transactions.service';
import { cn } from '@/lib/utils';

type TimeFilter = 'today' | 'week' | 'month';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const locale = useLocale();
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { customers } = useCustomers();
  const { hasFeature, isPaidPlan } = useSubscription();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [profile, setProfile] = useState<ServiceUserProfile | null>(null);
  const [, setProfileLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [customerSelectOpen, setCustomerSelectOpen] = useState(false);
  const [generatingCustomerPDF, setGeneratingCustomerPDF] = useState<string | null>(null);

  // Load user profile for business info
  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      try {
        const data = await userProfilesService.getProfile(user.id);
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  // Filter transactions by time period
  const getFilteredTransactions = (): Transaction[] => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let startDate: Date;
    switch (timeFilter) {
      case 'today':
        startDate = startOfDay;
        break;
      case 'week':
        startDate = startOfWeek;
        break;
      case 'month':
      default:
        startDate = startOfMonth;
        break;
    }

    return transactions.filter((tx) => {
      const txDate = new Date(tx.transaction_date || tx.created_at || 0);
      return txDate >= startDate;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate stats from filtered transactions
  const calculateStats = () => {
    let totalOwed = 0;
    let collected = 0;
    let newDebts = 0;
    let paymentsReceived = 0;
    const uniqueCustomers = new Set<string>();

    for (const tx of filteredTransactions) {
      uniqueCustomers.add(tx.customer_id);
      if (tx.type === 'debt') {
        totalOwed += tx.amount;
        newDebts += tx.amount;
      } else {
        totalOwed -= tx.amount;
        collected += tx.amount;
        paymentsReceived += tx.amount;
      }
    }

    const collectionRate = newDebts > 0 ? (paymentsReceived / newDebts) * 100 : 0;

    return {
      totalOwed: Math.max(0, totalOwed),
      collected,
      newDebts,
      paymentsReceived,
      activeCustomers: uniqueCustomers.size,
      collectionRate: Math.min(100, collectionRate)
    };
  };

  const stats = calculateStats();
  const hasData = transactions.length > 0;
  const currency = profile?.currency || 'USD';

  const formatCurrency = (value: number) => {
    const currencyLocaleMap: Record<string, string> = {
      TRY: 'tr-TR',
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      IDR: 'id-ID',
      NGN: 'en-NG',
      EGP: 'ar-EG',
      ZAR: 'en-ZA',
      INR: 'en-IN',
    };
    const localeCode = currencyLocaleMap[currency] || 'en-US';
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    if (filteredTransactions.length === 0) {
      toast.warning('No transactions to export');
      return;
    }

    setExporting(true);
    try {
      const csvContent = generateTransactionsCSV({
        transactions: filteredTransactions,
        businessName: profile?.shop_name || undefined,
        currency: currency,
        locale: locale,
        dateRange: {
          start: timeFilter === 'today' ? new Date().toISOString().split('T')[0] :
                 timeFilter === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                 new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
      });

      const filename = generateCSVFilename('all', undefined, {
        start: timeFilter === 'today' ? new Date().toISOString().split('T')[0] :
               timeFilter === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
               new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      });

      downloadCSV(csvContent, filename);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  // Calculate debt aging from transactions
  const calculateDebtAging = () => {
    const now = new Date();
    const aging = {
      current: 0, // 0-30 days
      days30: 0, // 31-60 days
      days60: 0, // 61-90 days
      days90: 0, // 91+ days
      overdue: 0, // Over 90 days with outstanding balance
    };

    // Group debts by customer and calculate aging
    const customerDebts: Record<string, { debts: Array<{ date: Date; amount: number }>; payments: number }> = {};

    for (const tx of transactions) {
      if (!customerDebts[tx.customer_id]) {
        customerDebts[tx.customer_id] = { debts: [], payments: 0 };
      }

      if (tx.type === 'debt') {
        customerDebts[tx.customer_id].debts.push({
          date: new Date(tx.transaction_date || tx.created_at || 0),
          amount: tx.amount,
        });
      } else {
        customerDebts[tx.customer_id].payments += tx.amount;
      }
    }

    // Calculate aging for each customer
    for (const customerData of Object.values(customerDebts)) {
      let remainingPayments = customerData.payments;

      // Sort debts by date (oldest first) for FIFO payment application
      const sortedDebts = [...customerData.debts].sort((a, b) => a.date.getTime() - b.date.getTime());

      for (const debt of sortedDebts) {
        let effectiveAmount = debt.amount;

        // Apply payments to oldest debts first
        if (remainingPayments > 0) {
          if (remainingPayments >= effectiveAmount) {
            remainingPayments -= effectiveAmount;
            continue; // Debt fully paid, skip
          } else {
            effectiveAmount -= remainingPayments;
            remainingPayments = 0;
          }
        }

        // Calculate age of remaining debt
        const ageDays = Math.floor((now.getTime() - debt.date.getTime()) / (1000 * 60 * 60 * 24));

        if (ageDays <= 30) {
          aging.current += effectiveAmount;
        } else if (ageDays <= 60) {
          aging.days30 += effectiveAmount;
        } else if (ageDays <= 90) {
          aging.days60 += effectiveAmount;
        } else {
          aging.days90 += effectiveAmount;
          aging.overdue += effectiveAmount;
        }
      }
    }

    return aging;
  };

  const debtAging = calculateDebtAging();

  // Handle Shop PDF export
  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      // Get period dates
      const now = new Date();
      let periodStart: Date;
      switch (timeFilter) {
        case 'today':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          periodStart = new Date(now);
          periodStart.setDate(periodStart.getDate() - 7);
          break;
        case 'month':
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const reportData: ShopReportData = {
        businessInfo: {
          name: profile?.shop_name || user?.user_metadata?.full_name || 'My Business',
          currency: currency,
          language: locale,
        },
        summary: {
          totalOutstanding: stats.totalOwed,
          totalCollected: stats.collected,
          newDebts: stats.newDebts,
          paymentsReceived: stats.paymentsReceived,
          activeCustomers: stats.activeCustomers,
          collectionRate: stats.collectionRate,
        },
        debtAging: debtAging,
        customers: customers
          .filter(c => c.balance > 0)
          .sort((a, b) => b.balance - a.balance)
          .map(c => ({
            name: c.name,
            balance: c.balance,
            lastActivity: c.last_transaction_date || c.created_at || null,
          })),
        period: {
          start: periodStart.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      };

      const pdfBytes = await generateShopReportPDF({
        ...reportData,
        locale,
      });

      const dateStr = now.toISOString().split('T')[0];
      const filename = `shop_report_${timeFilter}_${dateStr}.pdf`;

      downloadPDF(pdfBytes, filename);
      toast.success('PDF report exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  // Handle Customer Statement PDF export
  const handleCustomerStatementPDF = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    setGeneratingCustomerPDF(customerId);
    try {
      const customerTransactions = transactions
        .filter(tx => tx.customer_id === customerId)
        .sort((a, b) => {
          const dateA = new Date(a.transaction_date || a.created_at || 0);
          const dateB = new Date(b.transaction_date || b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });

      const pdfBytes = await generateCustomerStatementPDF({
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone || null,
          address: customer.address || null,
          notes: customer.notes || null,
          balance: customer.balance,
          user_id: customer.user_id,
          created_at: customer.created_at || null,
          updated_at: customer.updated_at || null,
          is_archived: customer.is_archived || false,
          transaction_count: customerTransactions.length,
        },
        transactions: customerTransactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          transaction_date: tx.transaction_date,
          created_at: tx.created_at,
          description: tx.description,
        })),
        businessInfo: {
          name: profile?.shop_name || user?.user_metadata?.full_name || 'My Business',
          currency: currency,
          language: locale,
        },
        locale,
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const sanitizedName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `statement_${sanitizedName}_${dateStr}.pdf`;

      downloadPDF(pdfBytes, filename);
      toast.success('Customer statement exported successfully');
      setCustomerSelectOpen(false);
    } catch (error) {
      console.error('Error generating customer statement:', error);
      toast.error('Failed to generate customer statement');
    } finally {
      setGeneratingCustomerPDF(null);
    }
  };

  if (!hasData) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Empty State */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('empty.title')}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {t('empty.description')}
            </p>
            <Button asChild>
              <Link href="./dashboard">
                {t('empty.action')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Time Filter */}
        <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <TabsList>
            <TabsTrigger value="today" className="text-xs sm:text-sm">
              {t('timeFilter.today')}
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs sm:text-sm">
              {t('timeFilter.week')}
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs sm:text-sm">
              {t('timeFilter.month')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Shop Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('shopSummary.totalOwed')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.totalOwed)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-red-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12.5%
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('shopSummary.collected')}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.collected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8.2%
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('shopSummary.activeCustomers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.activeCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              With outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collection Rate
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.collectionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">+5.3% from last month</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debt Aging Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('debtAging.title')}
            </CardTitle>
            <CardDescription>
              Outstanding debts by age
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.current')}</span>
                <span className="font-medium">{formatCurrency(debtAging.current)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.days30')}</span>
                <span className="font-medium">{formatCurrency(debtAging.days30)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.days60')}</span>
                <span className="font-medium text-yellow-600">{formatCurrency(debtAging.days60)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.days90')}</span>
                <span className="font-medium text-orange-600">{formatCurrency(debtAging.days90)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.overdue')}</span>
                <span className="font-medium text-red-600">{formatCurrency(debtAging.overdue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('export.title')}
            </CardTitle>
            <CardDescription>
              {t('export.description') || 'Download reports and statements'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* PDF Export - Paid feature */}
            {hasFeature('dataExport') ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportPDF}
                disabled={exportingPDF || transactions.length === 0}
              >
                {exportingPDF ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t('export.pdf')}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start opacity-60"
                disabled
              >
                <Crown className="mr-2 h-4 w-4 text-primary" />
                {t('export.pdf')}
                <span className="ml-auto text-xs text-muted-foreground">Pro</span>
              </Button>
            )}

            {/* CSV Export - Paid feature */}
            {hasFeature('dataExport') ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportCSV}
                disabled={exporting || filteredTransactions.length === 0}
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t('export.csv')}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start opacity-60"
                disabled
              >
                <Crown className="mr-2 h-4 w-4 text-primary" />
                {t('export.csv')}
                <span className="ml-auto text-xs text-muted-foreground">Pro</span>
              </Button>
            )}

            {/* Customer Statement - Paid feature */}
            {hasFeature('dataExport') ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setCustomerSelectOpen(true)}
                disabled={customers.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                {t('export.customerStatement')}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start opacity-60"
                disabled
              >
                <Crown className="mr-2 h-4 w-4 text-primary" />
                {t('export.customerStatement')}
                <span className="ml-auto text-xs text-muted-foreground">Pro</span>
              </Button>
            )}

            {/* Upgrade prompt for free users */}
            {!isPaidPlan && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Upgrade to Pro</p>
                    <p>Unlock PDF exports, CSV downloads, and more features.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Statement Selection Dialog */}
      <Dialog open={customerSelectOpen} onOpenChange={setCustomerSelectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('export.selectCustomer') || 'Select Customer'}</DialogTitle>
            <DialogDescription>
              {t('export.selectCustomerDescription') || 'Choose a customer to generate their account statement'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {customers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {t('export.noCustomers') || 'No customers available'}
              </p>
            ) : (
              customers
                .filter(c => !c.is_archived)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((customer) => (
                  <Button
                    key={customer.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleCustomerStatementPDF(customer.id)}
                    disabled={generatingCustomerPDF === customer.id}
                  >
                    {generatingCustomerPDF === customer.id ? (
                      <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                    ) : (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3",
                        customer.balance > 0 ? "bg-red-500" : "bg-green-500"
                      )}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium">{customer.name}</p>
                      <p className={cn(
                        "text-xs",
                        customer.balance > 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {formatCurrency(Math.abs(customer.balance))}
                        {customer.balance > 0 ? ' outstanding' : ' settled'}
                      </p>
                    </div>
                    {generatingCustomerPDF === customer.id && (
                      <span className="text-xs text-muted-foreground">Generating...</span>
                    )}
                  </Button>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
