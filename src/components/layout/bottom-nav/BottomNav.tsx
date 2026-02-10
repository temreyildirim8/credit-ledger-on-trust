"use client";

import { usePathname } from "@/routing";
import { Link } from "@/routing";
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
    name: "Home",
    href: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/app/customers",
    icon: Users,
  },
  {
    name: "History",
    href: "/app/transactions",
    icon: Receipt,
  },
  {
    name: "Add",
    href: "/app/quick-add",
    icon: CirclePlus,
  },
  {
    name: "Settings",
    href: "/app/settings",
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

  // Extract locale and base path
  const segments = pathname.split("/");
  const locale = segments[1] || "en";
  const basePath = `/${locale}`;

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] z-50 pb-safe",
        className
      )}
    >
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const isActive = pathname === `${basePath}${item.href}`;
          const isAddButton = item.name === "Add";
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={`${basePath}${item.href}`}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-0 flex-1",
                "transition-colors duration-200"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center",
                  isAddButton &&
                    "-mt-6 w-14 h-14 rounded-full bg-[var(--color-accent)] text-white shadow-lg"
                )}
              >
                <Icon
                  className={cn(
                    isAddButton ? "w-7 h-7" : "w-5 h-5",
                    isActive && !isAddButton
                      ? "text-[var(--color-accent)]"
                      : !isAddButton
                      ? "text-[var(--color-text-secondary)]"
                      : ""
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive && !isAddButton
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)]"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
