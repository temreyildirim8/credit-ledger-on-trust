"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for the protected app routes.
 * Catches errors in dashboard, customers, transactions, etc.
 */
export default function AppError({ error, reset }: ErrorProps) {
  const t = useTranslations("errorBoundary");

  useEffect(() => {
    console.error("App error caught:", error);
  }, [error]);

  const handleGoHome = (): void => {
    window.location.href = "/";
  };

  const handleGoToDashboard = (): void => {
    const locale = window.location.pathname.split("/")[1] || "en";
    window.location.href = `/${locale}/dashboard`;
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
          {t("appError.title")}
        </h2>

        <p className="text-[var(--color-text-secondary)] mb-6">
          {t("appError.description")}
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left overflow-auto max-h-32">
            <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("tryAgain")}
          </Button>
          <Button
            onClick={handleGoToDashboard}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("goToDashboard")}
          </Button>
          <Button
            onClick={handleGoHome}
            className="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
          >
            <Home className="h-4 w-4" />
            {t("goHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
