"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { offlineCache } from "@/lib/pwa/offline-cache";
import { syncService } from "@/lib/pwa/sync-service";

// Type declaration for Background Sync API (not in standard TypeScript lib)
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

declare global {
  interface ServiceWorkerRegistration {
    sync?: SyncManager;
    readonly active: ServiceWorker | null;
  }
}

export type SyncConnectionStatus = "online" | "offline";
export type SyncQueueStatus = "idle" | "syncing" | "error";

export interface SyncStatus {
  /** Whether the device has internet connectivity */
  connectionStatus: SyncConnectionStatus;
  /** Current sync queue status */
  queueStatus: SyncQueueStatus;
  /** Number of items pending sync */
  pendingCount: number;
  /** Whether there's an active sync in progress */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncedAt: Date | null;
  /** Error message if sync failed */
  errorMessage: string | null;
}

const INITIAL_STATUS: SyncStatus = {
  connectionStatus: "online",
  queueStatus: "idle",
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  errorMessage: null,
};

/**
 * Hook to manage offline sync status
 * - Tracks online/offline state
 * - Monitors IndexedDB sync queue for pending items
 * - Provides sync trigger functionality
 */
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(INITIAL_STATUS);
  const { user } = useAuth();

  // Fetch pending sync count from IndexedDB
  const fetchPendingCount = useCallback(async () => {
    try {
      const count = await offlineCache.getPendingSyncCount();
      setStatus((prev) => ({
        ...prev,
        pendingCount: count,
      }));
    } catch (error) {
      console.error("Failed to fetch sync queue count:", error);
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setStatus((prev) => ({
        ...prev,
        connectionStatus: "online",
        errorMessage: null,
      }));

      // Trigger sync when coming back online
      await syncService.triggerBackgroundSync();
      fetchPendingCount();
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        connectionStatus: "offline",
      }));
    };

    // Set initial state
    setStatus((prev) => ({
      ...prev,
      connectionStatus: navigator.onLine ? "online" : "offline",
    }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchPendingCount]);

  // Subscribe to sync service changes
  useEffect(() => {
    const unsubscribe = syncService.subscribe((count) => {
      setStatus((prev) => ({
        ...prev,
        pendingCount: count,
      }));
    });

    // Initial fetch
    fetchPendingCount();

    return unsubscribe;
  }, [fetchPendingCount]);

  // Listen for service worker sync messages
  useEffect(() => {
    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        setStatus((prev) => ({
          ...prev,
          queueStatus: "idle",
          isSyncing: false,
          lastSyncedAt: new Date(event.data.timestamp),
          pendingCount: 0,
        }));
      }

      if (event.data?.type === "SYNC_ERROR") {
        setStatus((prev) => ({
          ...prev,
          queueStatus: "error",
          isSyncing: false,
          errorMessage: event.data.error || "Sync failed",
        }));
      }

      // Handle sync trigger from service worker (background sync)
      if (event.data?.type === "TRIGGER_SYNC") {
        console.log("[useSyncStatus] Received TRIGGER_SYNC from service worker");
        setStatus((prev) => ({ ...prev, isSyncing: true, queueStatus: "syncing" }));

        try {
          const result = await syncService.processSyncQueue();

          if (result.failed > 0) {
            setStatus((prev) => ({
              ...prev,
              queueStatus: "error",
              isSyncing: false,
              errorMessage: `${result.failed} items failed to sync`,
            }));
          } else {
            setStatus((prev) => ({
              ...prev,
              queueStatus: "idle",
              isSyncing: false,
              lastSyncedAt: new Date(event.data.timestamp),
              pendingCount: 0,
            }));
          }

          await fetchPendingCount();
        } catch (error) {
          console.error("[useSyncStatus] Sync failed:", error);
          setStatus((prev) => ({
            ...prev,
            queueStatus: "error",
            isSyncing: false,
            errorMessage: "Sync failed",
          }));
        }
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage
      );
      return () => {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage
        );
      };
    }
  }, [fetchPendingCount]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    setStatus((prev) => ({ ...prev, isSyncing: true, queueStatus: "syncing" }));

    try {
      const result = await syncService.processSyncQueue();

      if (result.failed > 0) {
        setStatus((prev) => ({
          ...prev,
          queueStatus: "error",
          isSyncing: false,
          errorMessage: `${result.failed} items failed to sync`,
        }));
      } else {
        setStatus((prev) => ({
          ...prev,
          queueStatus: "idle",
          isSyncing: false,
          lastSyncedAt: new Date(),
          pendingCount: 0,
        }));
      }

      await fetchPendingCount();
    } catch (error) {
      console.error("Failed to trigger sync:", error);
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        queueStatus: "error",
        errorMessage: "Failed to trigger sync",
      }));
    }
  }, [fetchPendingCount]);

  return {
    ...status,
    triggerSync,
    refreshPendingCount: fetchPendingCount,
  };
}
