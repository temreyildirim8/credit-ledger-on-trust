import { Sidebar } from "../sidebar";
import { BottomNav } from "../bottom-nav";
import { AppHeader } from "../app-header";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

/**
 * App Shell component for authenticated pages
 * Includes Sidebar (desktop), BottomNav (mobile), and AppHeader (mobile)
 * Unified layout with proper max-width for content
 */
export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="app-shell min-h-screen bg-bg">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="app-content">
        {/* Content wrapper with max-width */}
        <div className="app-content-inner">
          {/* Mobile Header */}
          <div className="md:hidden mb-4">
            <AppHeader title={title} subtitle={subtitle} />
          </div>

          {/* Page Content */}
          <div className="animate-in">{children}</div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
