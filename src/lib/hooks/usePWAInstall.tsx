"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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
  showInstallPromptAfter?: number; // Delay in ms before showing install UI
  onInstallPrompt?: () => void; // Callback when install is ready to show
}

export function PWAInstallProvider({
  children,
  showInstallPromptAfter = 3000,
  onInstallPrompt,
}: PWAInstallProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed - use initial state instead of setState
    const alreadyInstalled = window.matchMedia("(display-mode: standalone)").matches;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      console.log("[PWA] Install captured, prompt available");

      // Notify parent component that install is ready
      if (onInstallPrompt) {
        setTimeout(onInstallPrompt, showInstallPromptAfter);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] App installed");
    };

    // Set initial installed state using a microtask to avoid synchronous setState
    if (alreadyInstalled) {
      queueMicrotask(() => setIsInstalled(true));
    } else {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [onInstallPrompt, showInstallPromptAfter]);

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
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error("usePWAInstall must be used within PWAInstallProvider");
  }
  return context;
}
