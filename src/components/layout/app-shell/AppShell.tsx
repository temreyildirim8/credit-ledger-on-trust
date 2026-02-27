"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../sidebar";
import { BottomNav } from "../bottom-nav";
import { AppHeader } from "../app-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBackgroundSync } from "@/lib/hooks/useBackgroundSync";

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

  // Track sidebar collapsed state for content margin
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  // Handle resize to force collapse below lg, restore state above lg
  useEffect(() => {
    const handleResize = () => {
      const belowLg = window.innerWidth < LG_BREAKPOINT;
      setIsBelowLg(belowLg);
      if (belowLg) {
        setSidebarCollapsed(true);
      } else {
        // Restore saved state when above lg
        const stored = localStorage.getItem("sidebar-collapsed");
        setSidebarCollapsed(stored === "true");
      }
    };

    window.addEventListener("resize", handleResize);
    // Initial check
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent<{ collapsed: boolean }>) => {
      setSidebarCollapsed(e.detail.collapsed);
    };

    window.addEventListener(
      "sidebar-toggle",
      handleSidebarToggle as EventListener
    );
    return () => {
      window.removeEventListener(
        "sidebar-toggle",
        handleSidebarToggle as EventListener
      );
    };
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
