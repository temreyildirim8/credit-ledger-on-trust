"use client";

import { Link } from "@/routing";
import {
  PlusCircle,
  MinusCircle,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  href: string;
  variant: "primary" | "secondary";
}

function ActionButton({ label, icon, href, variant }: ActionButtonProps) {
  const variantStyles = {
    primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]",
    secondary: "bg-white dark:bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-accent)]",
  };

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
        variantStyles[variant]
      )}
    >
      <div className="p-3 rounded-full bg-current">
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
  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3">
      <ActionButton
        label="Add Debt"
        icon={<PlusCircle className="h-5 w-5" />}
        href="/quick-add?type=debt"
        variant="primary"
      />
      <ActionButton
        label="Add Payment"
        icon={<MinusCircle className="h-5 w-5" />}
        href="/quick-add?type=payment"
        variant="secondary"
      />
      <ActionButton
        label="Add Customer"
        icon={<UserPlus className="h-5 w-5" />}
        href="/customers?add=true"
        variant="secondary"
      />
      <ActionButton
        label="Remind All"
        icon={<MessageSquare className="h-5 w-5" />}
        href="#"
        variant="secondary"
      />
    </div>
  );
}
