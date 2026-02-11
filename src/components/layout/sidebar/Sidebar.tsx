"use client";

import { usePathname } from "@/routing";
import { Link } from "@/routing";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CirclePlus,
  Settings,
  LogOut,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Quick Add",
    href: "/quick-add",
    icon: CirclePlus,
  },
  {
    name: "Settings",
    href: "/settings",
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
  const { signOut } = useAuth();

  // Extract locale and base path
  const segments = pathname.split("/");
  const locale = segments[1] || "en";
  const basePath = `/${locale}`;

  const handleLogout = async () => {
    try {
      await signOut();
      // Use window.location.replace for absolute path navigation
      window.location.replace(`/${locale}/login`);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-[260px] bg-surface border-r border-border",
        "fixed top-0 left-0 bottom-0 z-50",
        className,
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center transition-transform group-hover:scale-105">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M3 11L12 3l9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"
                fill="white"
                fillOpacity="0.2"
              />
              <path
                d="M3 11L12 3l9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"
                stroke="white"
              />
              <path d="M12 10V16M12 16L9 13M12 16L15 13" stroke="white" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-semibold text-base text-text">
              Global Ledger
            </h1>
            <p className="text-xs text-text-secondary">Credit Management</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === `${basePath}${item.href}`;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "group relative overflow-hidden",
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text",
              )}
            >
              {/* Active indicator background */}
              {isActive && (
                <div className="absolute inset-0 bg-accent opacity-100" />
              )}
              {/* Hover background for non-active */}
              {!isActive && (
                <div className="absolute inset-0 bg-surface-alt opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="font-medium text-sm relative z-10">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-3 pb-2">
        <ThemeToggle />
      </div>

      {/* Quick Stats Section */}
      <div className="p-4 border-t border-border">
        <div className="bg-surface-alt rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">This Month</p>
              <p className="text-sm font-semibold text-text">₺12,450</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Collected</p>
              <p className="text-sm font-semibold text-text">₺8,230</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-error hover:bg-error/5 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
