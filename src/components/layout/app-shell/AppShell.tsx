"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../sidebar";
import { BottomNav } from "../bottom-nav";
import { AppHeader } from "../app-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBackgroundSync } from "@/lib/hooks/useBackgroundSync";
import { useSidebarCollapsed } from "@/lib/store";

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const LG_BREAKPOINT = 1024;

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

/**
 * App Shell component for authenticated pages
 * Includes Sidebar (desktop), BottomNav (mobile), and AppHeader (mobile)
 * Unified layout with proper max-width for content
 * Sidebar is collapsible: expanded (240px) / collapsed (80px)
 */
export function AppShell({ children, title, subtitle }: AppShellProps) {
  // Initialize background sync processor
  useBackgroundSync();

  // Track if screen is below lg breakpoint
  const [isBelowLg, setIsBelowLg] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < LG_BREAKPOINT;
  });

  // Get sidebar state from Zustand store (auto-persisted)
  const sidebarCollapsed = useSidebarCollapsed();

  // Handle resize to detect breakpoint changes
  useEffect(() => {
    const handleResize = () => {
      setIsBelowLg(window.innerWidth < LG_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Force collapsed state when below lg
  const effectiveCollapsed = isBelowLg ? true : sidebarCollapsed;

  const contentMargin = effectiveCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_EXPANDED_WIDTH;

  return (
    <TooltipProvider>
      <div className="app-shell min-h-screen bg-bg">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          className="app-content"
          role="main"
          style={{
            marginInlineStart: contentMargin,
            transition: "margin-inline-start 0.3s ease-in-out",
          }}
        >
          {/* Content wrapper with max-width */}
          <div className="app-content-inner">
            {/* Mobile Header */}
            <div className="md:hidden mb-4">
              <AppHeader title={title} subtitle={subtitle} />
            </div>

            {/* Page Content */}
            <div className="animate-in">{children}</div>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </TooltipProvider>
  );
}
