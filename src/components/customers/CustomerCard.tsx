'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/lib/services/customers.service';
import { formatCurrency } from '@/lib/utils/currency';
import { Phone, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  locale?: string;
  onClick?: () => void;
}

export function CustomerCard({ customer, locale = 'en', onClick }: CustomerCardProps) {
  const hasDebt = customer.balance > 0;

  return (
    <Card
      className="border-[var(--color-border)] hover:shadow-md hover:border-[var(--color-accent)] transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0",
          hasDebt ? "bg-red-500" : "bg-green-500"
        )}>
          {customer.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--color-text)] truncate">
            {customer.name}
          </h3>
          {customer.phone && (
            <div className="flex items-center gap-1 mt-1 text-sm text-[var(--color-text-secondary)]">
              <Phone className="h-3 w-3" />
              <span className="truncate">{customer.phone}</span>
            </div>
          )}
        </div>

        {/* Balance */}
        <div className="flex items-center gap-3">
          <Badge
            variant={hasDebt ? 'destructive' : 'secondary'}
            className={cn(
              "font-semibold px-3 py-1",
              hasDebt ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            {formatCurrency(Math.abs(customer.balance))}
          </Badge>
          <ArrowRight className="h-5 w-5 text-[var(--color-text-tertiary)]" />
        </div>
      </div>
    </Card>
  );
}
