"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../sidebar";
import { BottomNav } from "../bottom-nav";
import { AppHeader } from "../app-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBackgroundSync } from "@/lib/hooks/useBackgroundSync";

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 80;

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

  // Track sidebar collapsed state for content margin
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

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

  const contentMargin = sidebarCollapsed
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
            marginLeft: contentMargin,
            transition: "margin-left 0.3s ease-in-out",
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
