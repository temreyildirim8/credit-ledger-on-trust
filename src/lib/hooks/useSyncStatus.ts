"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

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
 * - Monitors sync_queue table for pending items
 * - Provides sync trigger functionality
 */
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(INITIAL_STATUS);
  const { user } = useAuth();
  const supabase = createClient();

  // Fetch pending sync count from database
  const fetchPendingCount = useCallback(async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from("sync_queue")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      setStatus((prev) => ({
        ...prev,
        pendingCount: count || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch sync queue count:", error);
    }
  }, [user, supabase]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        connectionStatus: "online",
        errorMessage: null,
      }));
      // Trigger sync when coming back online
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

  // Subscribe to sync_queue changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("sync-queue-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sync_queue",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    // Initial fetch
    fetchPendingCount();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchPendingCount]);

  // Listen for service worker sync messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
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
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
      // Fallback: just refresh pending count
      setStatus((prev) => ({ ...prev, isSyncing: true, queueStatus: "syncing" }));
      fetchPendingCount();
      return;
    }

    setStatus((prev) => ({ ...prev, isSyncing: true, queueStatus: "syncing" }));

    try {
      const registration = await navigator.serviceWorker.ready;
      // Check if Background Sync API is available
      if (registration.sync) {
        await registration.sync.register("sync-transactions");
      } else {
        // Fallback: post message to service worker
        navigator.serviceWorker.controller?.postMessage({ type: "TRIGGER_SYNC" });
        // Simulate sync completion after a short delay
        setTimeout(() => {
          fetchPendingCount();
        }, 1000);
      }
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
