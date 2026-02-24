"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import {
  subscriptionsService,
  SubscriptionWithFeatures,
  PlanFeatures,
  PLAN_FEATURES,
} from "@/lib/services/subscription.service";
import type { SubscriptionPlan } from "@/lib/database.types";

interface SubscriptionContextType {
  subscription: SubscriptionWithFeatures | null;
  loading: boolean;
  error: Error | null;
  plan: SubscriptionPlan;
  features: PlanFeatures;
  isPaidPlan: boolean;
  customerLimit: number;
  hasFeature: (feature: keyof PlanFeatures) => boolean;
  isFeatureEnabled: (feature: keyof PlanFeatures) => boolean;
  upgradePlan: (plan: SubscriptionPlan) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultFeatures = PLAN_FEATURES.free;

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionWithFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsService.getSubscription(user.id);
      setSubscription(data);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch subscription"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const plan = useMemo(() => subscription?.plan ?? "free", [subscription?.plan]);
  const features = useMemo(() => subscription?.features ?? defaultFeatures, [subscription?.features]);
  const isPaidPlan = useMemo(() => plan !== "free", [plan]);
  const customerLimit = useMemo(() => features.maxCustomers, [features.maxCustomers]);

  const hasFeature = useCallback(
    (feature: keyof PlanFeatures): boolean => {
      const featureValue = features[feature];
      if (typeof featureValue === "number") {
        return featureValue > 0;
      }
      return featureValue === true;
    },
    [features]
  );

  // Alias for hasFeature for clarity
  const isFeatureEnabled = hasFeature;

  const upgradePlan = useCallback(
    async (newPlan: SubscriptionPlan) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      try {
        setLoading(true);
        const updated = await subscriptionsService.updatePlan(user.id, newPlan);
        setSubscription(updated);
      } catch (err) {
        console.error("Error upgrading plan:", err);
        setError(err instanceof Error ? err : new Error("Failed to upgrade plan"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  const refresh = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  const value: SubscriptionContextType = {
    subscription,
    loading,
    error,
    plan,
    features,
    isPaidPlan,
    customerLimit,
    hasFeature,
    isFeatureEnabled,
    upgradePlan,
    refresh,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

/**
 * Hook to check if a specific feature is available
 * Useful for conditional rendering without full subscription context
 */
export function useFeature(feature: keyof PlanFeatures): boolean {
  const { hasFeature, loading } = useSubscription();

  // Return false while loading to prevent flash of content
  if (loading) return false;

  return hasFeature(feature);
}

/**
 * Hook to check if user can add more customers
 * Returns { canAdd, currentCount, limit }
 */
export function useCustomerLimit(currentCustomerCount: number = 0) {
  const { customerLimit, isPaidPlan } = useSubscription();

  return {
    canAdd: currentCustomerCount < customerLimit,
    currentCount: currentCustomerCount,
    limit: customerLimit,
    isAtLimit: currentCustomerCount >= customerLimit,
    isNearLimit: currentCustomerCount >= customerLimit * 0.8,
    isPaidPlan,
  };
}
