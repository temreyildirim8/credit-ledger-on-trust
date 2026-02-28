"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAProvider() {
  useEffect(() => {
    // Register SW — first unregister stale/stuck registrations, then register fresh
    if ("serviceWorker" in navigator) {
      (async () => {
        try {
          // Clean up any stuck/old registrations
          const existing = await navigator.serviceWorker.getRegistrations();
          await Promise.all(existing.map((reg) => reg.unregister()));
          // Register fresh
          const reg = await navigator.serviceWorker.register("/sw.js");
          console.log("[PWA] SW registered:", reg.scope);
        } catch (err) {
          console.warn("[PWA] SW registration failed:", err);
        }
      })();
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt event captured");
      window.dispatchEvent(
        new CustomEvent("pwa-installable", {
          detail: e as BeforeInstallPromptEvent,
        }),
      );
    };

    window.addEventListener("pwa-installable", () => {
      console.log("[PWA] pwa-installable event received");
    });

    const handleAppInstalled = () => {
      window.dispatchEvent(new CustomEvent("pwa-installed"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
