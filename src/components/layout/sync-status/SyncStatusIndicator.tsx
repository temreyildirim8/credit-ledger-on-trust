"use client";

import { useSyncStatus } from "@/lib/hooks/useSyncStatus";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  WifiOff,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusIndicatorProps {
  /** Show as compact badge (mobile) or full indicator (desktop) */
  variant?: "compact" | "full";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sync Status Indicator
 * Shows online/offline status and pending sync count
 * Allows manual sync trigger when online
 */
export function SyncStatusIndicator({
  variant = "full",
  className,
}: SyncStatusIndicatorProps) {
  const t = useTranslations("syncStatus");
  const {
    connectionStatus,
    queueStatus,
    pendingCount,
    isSyncing,
    lastSyncedAt,
    errorMessage,
    triggerSync,
  } = useSyncStatus();

  const isOnline = connectionStatus === "online";
  const hasPending = pendingCount > 0;
  const hasError = queueStatus === "error";

  // Format last sync time
  const formatLastSync = (date: Date | null) => {
    if (!date) return t("never");
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { count: diffMins });

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });

    return date.toLocaleDateString();
  };

  // Get status icon and color
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        color: "text-orange-500 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-950/50",
        borderColor: "border-orange-200 dark:border-orange-800",
        label: t("offline"),
      };
    }

    if (hasError) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: "text-red-500 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950/50",
        borderColor: "border-red-200 dark:border-red-800",
        label: t("syncError"),
      };
    }

    if (isSyncing) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        color: "text-blue-500 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/50",
        borderColor: "border-blue-200 dark:border-blue-800",
        label: t("syncing"),
      };
    }

    if (hasPending) {
      return {
        icon: <Cloud className="h-4 w-4" />,
        color: "text-amber-500 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/50",
        borderColor: "border-amber-200 dark:border-amber-800",
        label: t("pending"),
      };
    }

    return {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-green-500 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
      borderColor: "border-green-200 dark:border-green-800",
      label: t("synced"),
    };
  };

  const statusDisplay = getStatusDisplay();

  // Compact variant for mobile/small spaces
  if (variant === "compact") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={isOnline && hasPending ? triggerSync : undefined}
            className={cn(
              "flex items-center justify-center p-2 rounded-full transition-colors",
              statusDisplay.bgColor,
              statusDisplay.borderColor,
              "border",
              isOnline && hasPending && "cursor-pointer hover:opacity-80",
              className,
            )}
            aria-label={statusDisplay.label}
            disabled={!isOnline || isSyncing}
          >
            <span className={statusDisplay.color}>{statusDisplay.icon}</span>
            {hasPending && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-amber-500 text-white rounded-full px-1">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="text-center">
            <p className="font-medium">{statusDisplay.label}</p>
            {hasPending && (
              <p className="text-xs text-muted-foreground">
                {t("pendingCount", { count: pendingCount })}
              </p>
            )}
            {!isOnline && (
              <p className="text-xs text-muted-foreground">
                {t("willSyncWhenOnline")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Full variant for desktop
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg border",
        statusDisplay.bgColor,
        statusDisplay.borderColor,
        className,
      )}
    >
      {/* Status Icon */}
      <div className={cn("flex items-center", statusDisplay.color)}>
        {statusDisplay.icon}
      </div>

      {/* Status Info */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text">
            {isOnline ? (
              hasPending ? (
                <>
                  <Wifi className="inline h-3 w-3 mr-1" />
                  {t("online")}
                </>
              ) : (
                t("allSynced")
              )
            ) : (
              <>
                <WifiOff className="inline h-3 w-3 mr-1" />
                {t("offline")}
              </>
            )}
          </span>
        </div>

        {/* Pending count or last sync */}
        <span className="text-xs text-muted-foreground">
          {hasPending ? (
            t("pendingCount", { count: pendingCount })
          ) : hasError ? (
            errorMessage || t("syncFailed")
          ) : (
            <>
              {t("lastSync")}: {formatLastSync(lastSyncedAt)}
            </>
          )}
        </span>
      </div>

      {/* Sync Button */}
      {isOnline && hasPending && (
        <Button
          size="sm"
          variant="ghost"
          onClick={triggerSync}
          disabled={isSyncing}
          className="shrink-0 h-8 px-2"
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              {t("sync")}
            </>
          )}
        </Button>
      )}

      {/* Offline Badge */}
      {!isOnline && (
        <Badge
          variant="outline"
          className="shrink-0 text-xs border-orange-300 text-orange-600"
        >
          {t("offlineMode")}
        </Badge>
      )}
    </div>
  );
}
