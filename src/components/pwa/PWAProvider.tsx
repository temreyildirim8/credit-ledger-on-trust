"use client";

import { useEffect } from "react";

export function PWAProvider() {
  useEffect(() => {
    // Register service worker only in production (Next.js dev mode redirects cause issues)
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    }

    // Handle before install prompt
    let deferredPrompt: any = null;
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt event captured");
      // Store the event for later use
      deferredPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-installable", { detail: e }));
      console.log("[PWA] Custom event pwa-installable dispatched");
    };

    window.addEventListener("pwa-installable", () => {
      console.log(
        "[PWA] pwa-installable event received - waiting for user interaction to show install prompt",
      );
      console.log(
        "[PWA] To show the install banner, call: deferredPrompt.userChoice.then(...)",
      );
    });

    // Handle app installed
    const handleAppInstalled = () => {
      window.dispatchEvent(new CustomEvent("pwa-installed"));
    };

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
