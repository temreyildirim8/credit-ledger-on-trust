"use client";

import { ReactNode } from "react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { PlanFeatures } from "@/lib/services/subscription.service";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeatureGuardProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  upgradeMessage?: string;
  onUpgradeClick?: () => void;
  className?: string;
}

/**
 * Component that conditionally renders children based on subscription plan features.
 * Shows upgrade prompt or fallback if feature is not available.
 */
export function FeatureGuard({
  feature,
  children,
  fallback,
  showUpgrade = false,
  upgradeMessage,
  onUpgradeClick,
  className,
}: FeatureGuardProps) {
  const { hasFeature, loading } = useSubscription();

  // Show nothing while loading to prevent flash
  if (loading) {
    return null;
  }

  // Feature is available - render children
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // Feature not available - show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgrade) {
    return (
      <div className={cn("relative", className)}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center p-4 max-w-sm">
            <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              {upgradeMessage || "Upgrade to access this feature"}
            </p>
            {onUpgradeClick && (
              <Button size="sm" onClick={onUpgradeClick}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>
        {/* Render children with opacity to show what's behind the paywall */}
        <div className="opacity-30 pointer-events-none">{children}</div>
      </div>
    );
  }

  // Default: render nothing
  return null;
}

interface PaidPlanGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  onUpgradeClick?: () => void;
}

/**
 * Component that only renders children for paid plans (basic, pro, enterprise).
 */
export function PaidPlanGuard({
  children,
  fallback,
  showUpgrade = false,
  onUpgradeClick,
}: PaidPlanGuardProps) {
  const { isPaidPlan, loading } = useSubscription();

  if (loading) {
    return null;
  }

  if (isPaidPlan) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgrade) {
    return (
      <div className="flex items-center justify-center p-4 border border-dashed rounded-lg">
        <div className="text-center">
          <Crown className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            This feature requires a paid plan
          </p>
          {onUpgradeClick && (
            <Button size="sm" variant="outline" className="mt-2" onClick={onUpgradeClick}>
              Upgrade
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

interface PlanGuardProps {
  allowedPlans: Array<"free" | "pro" | "enterprise">;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders children for specific plans.
 */
export function PlanGuard({ allowedPlans, children, fallback }: PlanGuardProps) {
  const { plan, loading } = useSubscription();

  if (loading) {
    return null;
  }

  if (allowedPlans.includes(plan)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return null;
}

interface FeatureBadgeProps {
  feature: keyof PlanFeatures;
  badge?: string;
  className?: string;
}

/**
 * Shows a badge for premium features.
 */
export function FeatureBadge({ feature, badge = "Pro", className }: FeatureBadgeProps) {
  const { hasFeature, loading } = useSubscription();

  if (loading || hasFeature(feature)) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary",
        className
      )}
    >
      <Crown className="h-3 w-3" />
      {badge}
    </span>
  );
}
