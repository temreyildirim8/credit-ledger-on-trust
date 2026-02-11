"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

type Props = {
  children: React.ReactNode;
  params?: Promise<{ locale: string }>;
};

/**
 * Protected app layout
 * Requires authentication - redirects to login if not authenticated
 * Uses AppShell component with sidebar (desktop) and bottom nav (mobile)
 */
export default function AppLayout({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login with return URL
      const currentPath = window.location.pathname;
      const locale = currentPath.split("/")[1] || "en";
      router.push(
        `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`,
      );
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-[var(--color-accent)]"
          aria-hidden="true"
          suppressHydrationWarning
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
