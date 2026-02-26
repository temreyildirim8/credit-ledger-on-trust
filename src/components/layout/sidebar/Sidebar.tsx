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
  BookOpen,
  Download,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SyncStatusIndicator } from "@/components/layout/sync-status";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { usePWAInstall } from "@/components/pwa/PWAInstallProvider";
import { useSubscription } from "@/lib/hooks/useSubscription";
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
    key: "reports",
    href: "/reports",
    icon: BarChart3,
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
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { hasFeature } = useSubscription();

  // Check if theme change is allowed (Pro feature)
  const canChangeTheme = hasFeature("themeChange");

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
      new CustomEvent("sidebar-toggle", { detail: { collapsed: isCollapsed } }),
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
        className,
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Logo Header */}
      <div
        className={cn(
          "flex items-center border-b border-border transition-all duration-300 cursor-pointer",
          isCollapsed ? "justify-center p-3" : "gap-3 p-5",
        )}
        onDoubleClick={toggleSidebar}
        title="Double-click to toggle sidebar"
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
          onClick={(e) => isCollapsed && e.preventDefault()}
        >
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
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

      {/* Language Switcher */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300",
          isCollapsed ? "flex justify-center px-0 py-2" : "px-3 py-2",
        )}
        onClick={() => {
          if (isCollapsed) {
            setIsCollapsed(false);
          }
        }}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className={isCollapsed ? "flex justify-center" : "w-full"}>
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

      {/* Sync Status Indicator */}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "flex justify-center px-2 py-2" : "px-3 py-2",
        )}
      >
        {isCollapsed ? (
          <SyncStatusIndicator variant="compact" />
        ) : (
          <SyncStatusIndicator variant="full" />
        )}
      </div>

      {/* PWA Install Button */}
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "flex justify-center px-0 py-2" : "px-3 py-2",
        )}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={install}
              disabled={isInstalled || !isInstallable}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg transition-all duration-200",
                isInstalled
                  ? "text-[var(--color-success)] cursor-default"
                  : isInstallable
                    ? "text-accent hover:bg-accent/10 cursor-pointer"
                    : "text-text-tertiary cursor-not-allowed opacity-50",
                isCollapsed
                  ? "justify-center h-9 w-9"
                  : "justify-start py-2 px-3",
              )}
              aria-label={
                isInstalled
                  ? t("appInstalled")
                  : isInstallable
                    ? t("installApp")
                    : t("upgradeForPWA")
              }
            >
              {isInstalled ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Download className="w-5 h-5 flex-shrink-0" />
              )}
              {!isCollapsed && (
                <span className="text-sm font-medium">
                  {isInstalled ? t("appInstalled") : t("installApp")}
                </span>
              )}
            </button>
          </TooltipTrigger>
          {isCollapsed ? (
            <TooltipContent
              side="right"
              className="bg-surface border border-border shadow-lg"
            >
              {isInstalled
                ? t("appInstalled")
                : isInstallable
                  ? t("installApp")
                  : t("upgradeForPWADesc")}
            </TooltipContent>
          ) : !isInstallable && !isInstalled ? (
            <TooltipContent
              side="top"
              className="bg-surface border border-border shadow-lg"
            >
              {t("upgradeForPWADesc")}
            </TooltipContent>
          ) : null}
        </Tooltip>
      </div>

      {/* Theme Toggle */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300",
          isCollapsed ? "flex justify-center px-0 py-3" : "px-3 py-2",
        )}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className={isCollapsed ? "flex justify-center" : "w-full"}>
              <ThemeToggle
                variant={isCollapsed ? "compact" : "full"}
                disabled={!canChangeTheme}
              />
            </div>
          </TooltipTrigger>
          {isCollapsed ? (
            <TooltipContent
              side="right"
              className="bg-surface border border-border shadow-lg"
            >
              {canChangeTheme
                ? t("toggleTheme") || "Toggle Theme"
                : t("upgradeForTheme")}
            </TooltipContent>
          ) : !canChangeTheme ? (
            <TooltipContent
              side="top"
              className="bg-surface border border-border shadow-lg"
            >
              {t("upgradeForTheme")}
            </TooltipContent>
          ) : null}
        </Tooltip>
      </div>

      {/* Collapse Toggle Button */}
      <div
        className={cn(
          "border-t border-border transition-all duration-300",
          isCollapsed ? "px-0 py-3 flex justify-center" : "px-3 py-3",
        )}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg transition-all duration-200",
                "text-text-secondary hover:bg-surface-alt hover:text-text",
                isCollapsed ? "justify-center h-9" : "justify-start py-2 px-3",
              )}
              aria-label={
                isCollapsed ? t("expandSidebar") : t("collapseSidebar")
              }
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
          isCollapsed ? "px-0 py-3 flex justify-center" : "p-4",
        )}
      >
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 rounded-lg text-error hover:bg-error/5 transition-all duration-200 group",
                isCollapsed ? "justify-center h-9 w-9" : "px-3 py-2.5 w-full",
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
