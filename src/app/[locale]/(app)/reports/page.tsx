'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  Calendar
} from 'lucide-react';
import Link from 'next/link';

type TimeFilter = 'today' | 'week' | 'month';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  // Mock data - in production this would come from Supabase
  const hasData = false; // Toggle this to see empty state vs data view

  const stats = {
    totalOwed: 15420.50,
    collected: 8500.00,
    newDebts: 4200.00,
    paymentsReceived: 6800.00,
    activeCustomers: 12,
    collectionRate: 68.5
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
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
              Download reports and statements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" disabled>
              <Download className="mr-2 h-4 w-4" />
              {t('export.pdf')}
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Download className="mr-2 h-4 w-4" />
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
