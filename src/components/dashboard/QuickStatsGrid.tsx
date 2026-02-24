"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant: "debt" | "collected" | "customers" | "month";
}

function StatCard({ label, value, icon, variant }: StatCardProps) {
  const variantStyles = {
    debt: "bg-debt/10 text-debt-text",
    collected: "bg-payment/10 text-payment-text",
    customers: "bg-accent/10 text-accent",
    month: "bg-surface-alt text-text",
  };

  return (
    <Card className={cn("border-border hover:shadow-sm transition-shadow", variantStyles[variant])}>
      <div className="p-4 md:p-5">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
          {label}
        </p>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", variantStyles[variant])}>
            {icon}
          </div>
          <span className="text-2xl font-bold">{value}</span>
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
  const t = useTranslations("dashboard.stats");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label={t("totalOwed")}
        value={formatCurrency(totalDebt)}
        icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5" />}
        variant="debt"
      />
      <StatCard
        label={t("collected")}
        value={formatCurrency(totalCollected)}
        icon={<TrendingDown className="h-4 w-4 md:h-5 md:w-5" />}
        variant="collected"
      />
      <StatCard
        label={t("activeCustomers")}
        value={activeCustomers}
        icon={<Users className="h-4 w-4 md:h-5 md:w-5" />}
        variant="customers"
      />
      <StatCard
        label={t("thisMonth")}
        value={formatCurrency(thisMonth)}
        icon={<DollarSign className="h-4 w-4 md:h-5 md:w-5" />}
        variant="month"
      />
    </div>
  );
}
