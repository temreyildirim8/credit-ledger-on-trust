"use client";

import { Card } from "@/components/ui/card";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { formatCurrency } from "@/lib/utils/currency";

interface Activity {
  id: string;
  customerName: string;
  amount: number;
  type: "debt" | "payment";
  date: string | Date;
}

interface RecentActivityProps {
  activities?: Activity[];
  locale?: string;
}

export function RecentActivity({ activities = [], locale = "en" }: RecentActivityProps) {
  const dateLocale: Locale = locale as any || "enUS";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: locale === "tr" ? "TRY" : "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (activities.length === 0) {
    return (
      <Card className="border-border">
        <div className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-text-secondary mb-3" />
          <h3 className="text-lg font-semibold text-text mb-1">No activity yet</h3>
          <p className="text-sm text-text-secondary">
            Start by adding your first customer or recording a transaction
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const isDebt = activity.type === "debt";

        return (
          <Card
            key={activity.id}
            className="border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      "p-2 rounded-lg text-xs font-semibold uppercase",
                      isDebt ? "bg-debt text-white" : "bg-payment text-white"
                    )}
                  >
                    {activity.type === "debt" ? "Debt" : "Payment"}
                  </div>
                  <span className="font-medium text-text text-sm">
                    {activity.customerName}
                  </span>
                </div>
                <p className="text-xs text-text-secondary flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDistanceToNow(
                    new Date(activity.date),
                    { addSuffix: true, locale: dateLocale }
                  )}
                </p>
              </div>
              <div>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    isDebt ? "text-debt-text" : "text-payment-text"
                  )}
                >
                  {isDebt ? "+" : "-"}
                  {formatCurrency(activity.amount)}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
