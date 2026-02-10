import { Sidebar } from "../sidebar";
import { BottomNav } from "../bottom-nav";
import { AppHeader } from "../app-header";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

/**
 * App Shell component for authenticated pages
 * Includes Sidebar (desktop), BottomNav (mobile), and AppHeader (mobile)
 */
export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:ml-64 pb-16 md:pb-0">
        {/* Mobile Header */}
        <AppHeader title={title} subtitle={subtitle} />

        {/* Page Content */}
        <div className="p-4 md:p-6">{children}</div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
