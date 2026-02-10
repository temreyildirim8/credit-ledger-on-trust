"use client";

import { Card } from "@/components/ui/card";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (activities.length === 0) {
    return (
      <Card className="border-[var(--color-border)]">
        <div className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto text-[var(--color-text-tertiary)] mb-3" />
          <h3 className="font-medium text-[var(--color-text)] mb-1">No activity yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
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
            className="border-[var(--color-border)] hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  "p-3 rounded-full",
                  isDebt
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                    : "bg-green-100 dark:bg-green-900/30 text-green-600"
                )}
              >
                <User className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text)] truncate">
                  {activity.customerName}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(activity.date), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              <div
                className={cn(
                  "text-right font-semibold",
                  isDebt ? "text-red-600" : "text-green-600"
                )}
              >
                {isDebt ? "+" : "-"}
                {formatCurrency(activity.amount)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
