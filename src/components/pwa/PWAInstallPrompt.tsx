"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { usePWAInstall } from "@/lib/hooks/usePWAInstall";
import { useTranslations } from "next-intl";

export function PWAInstallPrompt() {
  const { isInstallable, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations("pwa.install");

  useEffect(() => {
    if (isInstallable) {
      // Show prompt after a short delay
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img
              src="/icons/icon.svg"
              alt="App icon"
              className="h-12 w-12 rounded-lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {t("title")}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={install}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
              >
                {t("install")}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-md transition-colors"
              >
                {t("notNow")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
