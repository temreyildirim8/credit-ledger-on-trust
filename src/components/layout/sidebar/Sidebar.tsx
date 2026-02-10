"use client";

import { usePathname } from "@/routing";
import { Link } from "@/routing";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CirclePlus,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/app/customers",
    icon: Users,
  },
  {
    name: "Transactions",
    href: "/app/transactions",
    icon: Receipt,
  },
  {
    name: "Quick Add",
    href: "/app/quick-add",
    icon: CirclePlus,
  },
  {
    name: "Settings",
    href: "/app/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

/**
 * Desktop sidebar navigation for authenticated app
 * Hidden on mobile, visible on desktop (≥768px)
 */
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  // Extract locale and base path
  const segments = pathname.split("/");
  const locale = segments[1] || "en";
  const basePath = `/${locale}`;

  const handleLogout = () => {
    // TODO: Implement logout
    console.log("Logout clicked");
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 bg-white border-r border-[var(--color-border)] h-screen sticky top-0",
        className
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <Link href={basePath} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
            >
              <path
                d="M12 2L2 7V17C2 18.1 2.9 19 4 19H20C21.1 19 22 18.1 22 17V7L12 2Z"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <path
                d="M12 2L2 7V17C2 18.1 2.9 19 4 19H20C21.1 19 22 18.1 22 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 10V16M12 16L9 13M12 16L15 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg text-[var(--color-text)]">
              Global Ledger
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Credit Management
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === `${basePath}${item.href}`;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={`${basePath}${item.href}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-[var(--color-error)] hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
