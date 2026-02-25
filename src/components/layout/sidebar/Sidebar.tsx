"use client";

import { useState, useEffect } from "react";
import { usePathname } from "@/routing";
import { Link } from "@/routing";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslations, useLocale } from "next-intl";
import { getBrandName } from "@/lib/branding";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CirclePlus,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SyncStatusIndicator } from "@/components/layout/sync-status";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 80;

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

interface SidebarProps {
  className?: string;
}

/**
 * Desktop sidebar navigation for authenticated app
 * Collapsible: expanded (240px) / collapsed (80px)
 * Hidden on mobile, visible on desktop (≥768px)
 */
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const t = useTranslations("nav");
  const localeHook = useLocale();

  // Collapsed state persisted to localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Default to false (expanded) on first load
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    // Dispatch custom event for AppShell to respond
    window.dispatchEvent(
      new CustomEvent("sidebar-toggle", { detail: { collapsed: isCollapsed } })
    );
  }, [isCollapsed]);

  // Extract locale and base path
  const segments = pathname.split("/");
  const locale = segments[1] || "en";
  const basePath = `/${locale}`;
  const brandName = getBrandName(localeHook);

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to marketing home page after sign out
      window.location.replace(`/${locale}`);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const sidebarWidth = isCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_EXPANDED_WIDTH;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-surface border-e border-border",
        "fixed top-0 start-0 bottom-0 z-50",
        "transition-all duration-300 ease-in-out",
        className
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Logo Header */}
      <div
        className={cn(
          "flex items-center border-b border-border transition-all duration-300 cursor-pointer",
          isCollapsed ? "justify-center p-3" : "gap-3 p-5"
        )}
        onDoubleClick={toggleSidebar}
        title="Double-click to toggle sidebar"
      >
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={(e) => isCollapsed && e.preventDefault()}
        >
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0">
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
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-semibold text-base text-text whitespace-nowrap">
                {brandName}
              </h1>
              <p className="text-xs text-text-secondary whitespace-nowrap">
                Credit Management
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-2 py-4 space-y-1"
        data-tour="sidebar-nav"
        onDoubleClick={toggleSidebar}
        title="Double-click to toggle sidebar"
      >
        {navItems.map((item) => {
          const isActive = pathname === `${basePath}${item.href}`;
          const Icon = item.icon;

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg transition-all duration-200",
                "group relative overflow-hidden",
                isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:bg-surface-alt hover:text-text"
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
              <Icon className="w-5 h-5 relative z-10 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm relative z-10 whitespace-nowrap">
                  {t(item.key)}
                </span>
              )}
            </Link>
          );

          // Wrap with tooltip when collapsed
          if (isCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {t(item.key)}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Sync Status Indicator */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300",
          isCollapsed ? "flex justify-center px-2 py-2" : "px-3 py-2"
        )}
      >
        {isCollapsed ? (
          <SyncStatusIndicator variant="compact" />
        ) : (
          <SyncStatusIndicator variant="full" />
        )}
      </div>

      {/* Language Switcher */}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "flex justify-center px-0 py-2" : "px-3 py-2"
        )}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className={isCollapsed ? "flex justify-center" : ""}>
              <LanguageSwitcher variant={isCollapsed ? "compact" : "full"} />
            </div>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              {t("language") || "Language"}
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Theme Toggle */}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "flex justify-center px-0 pb-2" : "px-3 pb-2"
        )}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className={isCollapsed ? "flex justify-center" : ""}>
              <ThemeToggle variant={isCollapsed ? "compact" : "full"} />
            </div>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              {t("toggleTheme") || "Toggle Theme"}
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Collapse Toggle Button */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300",
          isCollapsed ? "px-0 py-3 flex justify-center" : "px-3 py-3"
        )}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className={cn(
                "flex items-center justify-center gap-2 w-full rounded-lg transition-all duration-200",
                "text-text-secondary hover:bg-surface-alt hover:text-text",
                isCollapsed ? "h-9" : "py-2 px-3"
              )}
              aria-label={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">{t("collapse")}</span>
                </>
              )}
            </button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">{t("expandSidebar")}</TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* User Section - Sign Out */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300",
          isCollapsed ? "px-0 py-3 flex justify-center" : "p-4"
        )}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 rounded-lg text-error hover:bg-error/5 transition-all duration-200 group",
                isCollapsed ? "justify-center h-9 w-9" : "px-3 py-2.5 w-full"
              )}
              aria-label={t("signOut")}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm">{t("signOut")}</span>
              )}
            </button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" className="text-error">
              {t("signOut")}
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}

// Export constants for use in AppShell
export { SIDEBAR_EXPANDED_WIDTH, SIDEBAR_COLLAPSED_WIDTH };
