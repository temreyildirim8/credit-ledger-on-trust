"use client";

import { Card } from "@/components/ui/card";
import { AlertCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface OverdueCustomer {
  id: string;
  name: string;
  amount: number;
  overdueDays: number;
}

interface OverdueDebtsProps {
  customers?: OverdueCustomer[];
  locale?: string;
}

export function OverdueDebts({ customers = [], locale = "en" }: OverdueDebtsProps) {
  const t = useTranslations("dashboard.overdueDebts");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: locale === "tr" ? "TRY" : "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (customers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-[var(--color-error)] flex-shrink-0" />
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t("title")}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">({customers.length})</p>
        </div>
      </div>

      <div className="space-y-3">
        {customers.map((customer) => (
          <Card
            key={customer.id}
            className="border-[var(--color-error)]/20 bg-[var(--color-error)]/5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex-1">
                <p className="font-medium text-[var(--color-text)]">{customer.name}</p>
                <p className="text-sm text-[var(--color-error)] mt-0.5">
                  {customer.overdueDays} {t("daysOverdue")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-semibold text-[var(--color-error)]">
                  {formatCurrency(customer.amount)}
                </p>
                <button
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg",
                    "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]",
                    "transition-colors duration-200"
                  )}
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {t("remind")}
                  </span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
