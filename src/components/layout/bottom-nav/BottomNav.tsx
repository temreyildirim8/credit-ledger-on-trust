"use client";

import { usePathname } from "@/routing";
import { Link } from "@/routing";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CirclePlus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "customers",
    href: "/customers",
    icon: Users,
  },
  {
    key: "transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    key: "quickAdd",
    href: "/quick-add",
    icon: CirclePlus,
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
  },
];

interface BottomNavProps {
  className?: string;
}

/**
 * Mobile bottom navigation for authenticated app
 * Visible on mobile (<768px), hidden on desktop
 */
export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  // Extract locale and base path
  const segments = pathname.split("/");
  const locale = segments[1] || "en";
  const basePath = `/${locale}`;

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 pb-safe",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 h-[68px]">
        {navItems.map((item) => {
          const isActive = pathname === `${basePath}${item.href}`;
          const isAddButton = item.key === "quickAdd";
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 min-w-0 flex-1"
            >
              <div
                className={cn(
                  "relative flex items-center justify-center transition-all duration-200",
                  isAddButton
                    ? "-mt-5 w-12 h-12 rounded-full bg-accent text-white shadow-lg shadow-accent"
                    : "w-11 h-11 rounded-xl"
                )}
              >
                <Icon
                  className={cn(
                    isAddButton ? "w-6 h-6" : "w-5 h-5",
                    isActive && !isAddButton
                      ? "text-accent"
                      : !isAddButton
                      ? "text-text-secondary"
                      : ""
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none mt-0.5",
                  isActive && !isAddButton
                    ? "text-accent"
                    : "text-text-secondary"
                )}
              >
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
