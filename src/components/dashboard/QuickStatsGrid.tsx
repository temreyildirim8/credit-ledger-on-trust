"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Landmark,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { formatCurrency } from "@/lib/utils/currency";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant: "debt" | "collected" | "customers" | "month";
  usdValue?: string;
}

function StatCard({ label, value, icon, variant, usdValue }: StatCardProps) {
  const variantStyles = {
    debt: "bg-[var(--color-debt)] text-[var(--color-debt-text)]",
    collected: "bg-[var(--color-payment)] text-[var(--color-payment-text)]",
    customers: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
    month: "bg-[var(--color-surface-alt)] text-[var(--color-text)]",
  };

  return (
    <Card
      className={cn(
        "border-[var(--color-border)] hover:shadow-sm transition-shadow",
        variantStyles[variant],
      )}
    >
      <div className="p-4 md:p-5">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
          {label}
        </p>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", variantStyles[variant])}>
            {icon}
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-[var(--color-text)]">
              {value}
            </span>
            {usdValue && (
              <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                ≈ {usdValue} USD
              </span>
            )}
          </div>
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
  currency?: string;
  usdEquivalent?: {
    totalDebt: number;
    totalCollected: number;
  };
}

export function QuickStatsGrid({
  totalDebt = 0,
  totalCollected = 0,
  activeCustomers = 0,
  thisMonth = 0,
  currency = "TRY",
  usdEquivalent,
}: QuickStatsGridProps) {
  const t = useTranslations("dashboard.stats");
  const { currency: userCurrency } = useUserProfile();
  const displayCurrency = currency || userCurrency;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label={t("totalOwed")}
        value={formatCurrency(Math.max(0, totalDebt), displayCurrency)}
        icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5" />}
        variant="debt"
        usdValue={
          usdEquivalent && displayCurrency !== "USD"
            ? formatCurrency(Math.max(0, usdEquivalent.totalDebt), "USD", 2)
            : undefined
        }
      />
      <StatCard
        label={t("collected")}
        value={formatCurrency(totalCollected, displayCurrency)}
        icon={<TrendingDown className="h-4 w-4 md:h-5 md:w-5" />}
        variant="collected"
        usdValue={
          usdEquivalent && displayCurrency !== "USD"
            ? formatCurrency(usdEquivalent.totalCollected, "USD", 2)
            : undefined
        }
      />
      <StatCard
        label={t("activeCustomers")}
        value={activeCustomers}
        icon={<Users className="h-4 w-4 md:h-5 md:w-5" />}
        variant="customers"
      />
      <StatCard
        label={t("thisMonth")}
        value={formatCurrency(thisMonth, displayCurrency)}
        icon={<Landmark className="h-4 w-4 md:h-5 md:w-5" />}
        variant="month"
      />
    </div>
  );
}
