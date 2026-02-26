"use client";

import { Link } from "@/routing";
import {
  PlusCircle,
  MinusCircle,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  href: string;
  variant: "primary" | "secondary";
}

function ActionButton({ label, icon, href, variant }: ActionButtonProps) {
  const variantStyles = {
    primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-sm",
    secondary: "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-border)]",
  };

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
        variantStyles[variant]
      )}
    >
      <div className="p-2.5 rounded-full bg-current/20">
        {icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

interface QuickActionsProps {
  locale?: string;
}

export function QuickActions({ locale = "en" }: QuickActionsProps) {
  const t = useTranslations('dashboard.quickActions');

  const basePath = locale ? `/${locale}` : '';

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3">
      <ActionButton
        label={t('addDebt')}
        icon={<PlusCircle className="h-5 w-5" />}
        href={`${basePath}/quick-add?type=debt`}
        variant="primary"
      />
      <ActionButton
        label={t('addPayment')}
        icon={<MinusCircle className="h-5 w-5" />}
        href={`${basePath}/quick-add?type=payment`}
        variant="secondary"
      />
      <ActionButton
        label={t('addCustomer')}
        icon={<UserPlus className="h-5 w-5" />}
        href={`${basePath}/customers?add=true`}
        variant="secondary"
      />
      <ActionButton
        label={t('sendReminders')}
        icon={<MessageSquare className="h-5 w-5" />}
        href="#"
        variant="secondary"
      />
    </div>
  );
}
