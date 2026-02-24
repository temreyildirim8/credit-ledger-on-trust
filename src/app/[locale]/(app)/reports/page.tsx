'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { userProfilesService, type UserProfile as ServiceUserProfile } from '@/lib/services/user-profiles.service';
import { generateTransactionsCSV, downloadCSV, generateCSVFilename } from '@/lib/utils/csv-export';
import type { Transaction } from '@/lib/services/transactions.service';

type TimeFilter = 'today' | 'week' | 'month';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const locale = useLocale();
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [profile, setProfile] = useState<ServiceUserProfile | null>(null);
  const [, setProfileLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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
                <span className="font-medium">{formatCurrency(8500)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.days30')}</span>
                <span className="font-medium">{formatCurrency(3200)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.days60')}</span>
                <span className="font-medium text-yellow-600">{formatCurrency(2100)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.days90')}</span>
                <span className="font-medium text-orange-600">{formatCurrency(1200)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('debtAging.overdue')}</span>
                <span className="font-medium text-red-600">{formatCurrency(420.50)}</span>
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
            <Button variant="outline" className="w-full justify-start" disabled>
              <Download className="mr-2 h-4 w-4" />
              {t('export.pdf')}
            </Button>
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
            <Button variant="outline" className="w-full justify-start" disabled>
              <FileText className="mr-2 h-4 w-4" />
              {t('export.customerStatement')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
