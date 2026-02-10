"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant: "debt" | "collected" | "customers" | "month";
}

function StatCard({ label, value, icon, variant }: StatCardProps) {
  const variantStyles = {
    debt: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800",
    collected: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800",
    customers: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800",
    month: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 border-amber-200 dark:border-amber-800",
  };

  const textStyles = {
    debt: "text-red-700 dark:text-red-300",
    collected: "text-green-700 dark:text-green-300",
    customers: "text-blue-700 dark:text-blue-300",
    month: "text-amber-700 dark:text-amber-300",
  };

  const iconStyles = {
    debt: "text-red-600",
    collected: "text-green-600",
    customers: "text-blue-600",
    month: "text-amber-600",
  };

  return (
    <Card className={cn("border", variantStyles[variant])}>
      <div className="p-4 md:p-6">
        <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
          {label}
        </p>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-white/50 dark:bg-black/20", iconStyles[variant])}>
            {icon}
          </div>
          <span className={cn("text-2xl font-bold", textStyles[variant])}>
            {value}
          </span>
        </div>
      </div>
    </Card>
  );
}

interface QuickStatsGridProps {
  totalDebt?: number;
  totalCollected?: number;
  activeCustomers?: number;
  thisMonth?: number;
}

export function QuickStatsGrid({
  totalDebt = 0,
  totalCollected = 0,
  activeCustomers = 0,
  thisMonth = 0,
}: QuickStatsGridProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        label="Total Owed"
        value={formatCurrency(totalDebt)}
        icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5" />}
        variant="debt"
      />
      <StatCard
        label="Collected"
        value={formatCurrency(totalCollected)}
        icon={<TrendingDown className="h-4 w-4 md:h-5 md:w-5" />}
        variant="collected"
      />
      <StatCard
        label="Active Customers"
        value={activeCustomers}
        icon={<Users className="h-4 w-4 md:h-5 md:w-5" />}
        variant="customers"
      />
      <StatCard
        label="This Month"
        value={formatCurrency(thisMonth)}
        icon={<DollarSign className="h-4 w-4 md:h-5 md:w-5" />}
        variant="month"
      />
    </div>
  );
}
