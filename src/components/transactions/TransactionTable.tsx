"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDistanceToNow } from "date-fns";
import { tr, enUS, es, id, hi, ar } from "date-fns/locale";
import type { Locale } from "date-fns";
import { Calendar, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Transaction } from "@/lib/services/transactions.service";

// Locale map for date-fns
const localeMap: Record<string, Locale> = { en: enUS, tr, es, id, hi, ar };

interface TransactionTableProps {
  transactions: Transaction[];
  locale?: string;
  currency?: string;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionTable({
  transactions,
  locale = "en",
  currency = "USD",
  onEdit,
}: TransactionTableProps) {
  const t = useTranslations("transactions");
  const dateLocale = localeMap[locale] || enUS;

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale,
    });
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              {t("form.type")}
            </TableHead>
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              {t("table.customer")}
            </TableHead>
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              {t("table.amount")}
            </TableHead>
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              {t("table.description")}
            </TableHead>
            <TableHead className="font-semibold text-[var(--color-text-secondary)]">
              {t("table.date")}
            </TableHead>
            {onEdit && (
              <TableHead className="font-semibold text-[var(--color-text-secondary)] w-16">
                {t("table.actions")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} className="group">
              <TableCell>
                <Badge
                  className={
                    transaction.type === "debt"
                      ? "bg-[var(--color-debt)] text-[var(--color-debt-text)]"
                      : "bg-[var(--color-payment)] text-[var(--color-payment-text)]"
                  }
                >
                  {transaction.type === "debt" ? t("form.debt") : t("form.payment")}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium text-[var(--color-text)]">
                  {transaction.customer_name || "-"}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`font-semibold ${
                    transaction.type === "debt"
                      ? "text-[var(--color-debt-text,#EF4444)]"
                      : "text-[var(--color-payment-text,#10B981)]"
                  }`}
                >
                  {transaction.type === "debt" ? "-" : "+"}
                  {formatCurrency(transaction.amount, currency)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {transaction.description || "-"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(transaction.transaction_date || transaction.created_at)}
                </span>
              </TableCell>
              {onEdit && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onEdit(transaction)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
