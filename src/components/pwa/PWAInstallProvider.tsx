"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { X } from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useLocale } from "next-intl";
import { getBrandName } from "@/lib/branding";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextValue {
  isInstallable: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextValue | undefined>(undefined);

interface PWAInstallProviderProps {
  children: ReactNode;
}

export function PWAInstallProvider({
  children,
}: PWAInstallProviderProps) {
  const locale = useLocale();
  const _brandName = getBrandName(locale);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  // Check if app is already installed on initial render
  const [isInstalled, setIsInstalled] = useState(
    typeof window !== 'undefined' && window.matchMedia("(display-mode: standalone)").matches
  );
  const { hasFeature, loading: subscriptionLoading } = useSubscription();

  // Check if user has PWA install feature (paid plans only)
  const canInstallPWA = hasFeature("pwaInstall");

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // Don't set isInstallable here - we'll check subscription first
      console.log("[PWA] Install captured, prompt available");
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] App installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Only show install prompt if user has paid plan and prompt is available
  useEffect(() => {
    if (deferredPrompt && canInstallPWA && !subscriptionLoading) {
      setIsInstallable(true);
    } else {
      setIsInstallable(false);
    }
  }, [deferredPrompt, canInstallPWA, subscriptionLoading]);

  const install = async () => {
    if (!deferredPrompt) {
      console.warn("[PWA] Install not available");
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("[PWA] User accepted install");
    } else {
      console.log("[PWA] User dismissed install");
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <PWAInstallContext.Provider value={{ isInstallable, isInstalled, install }}>
      {children}
      {isInstallable && <PWAInstallPrompt />}
    </PWAInstallContext.Provider>
  );
}

function PWAInstallPrompt() {
  const { install } = useContext(PWAInstallContext)!;
  const [isVisible, setIsVisible] = useState(false);
  const locale = useLocale();
  const brandName = getBrandName(locale);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon.svg"
              alt="App icon"
              className="h-12 w-12 rounded-lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Install App
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Install {brandName} for quick access and offline support.
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={install}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-md transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error("usePWAInstall must be used within PWAInstallProvider");
  }
  return context;
}
