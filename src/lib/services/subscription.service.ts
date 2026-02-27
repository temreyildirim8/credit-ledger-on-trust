import { configService } from "./config.service";
import type { SubscriptionPlan } from "@/lib/database.types";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  sms_limit: number | null;
  sms_used: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SubscriptionWithFeatures extends Subscription {
  features: PlanFeatures;
}

export interface PlanFeatures {
  maxCustomers: number | null; // null = unlimited
  unlimitedTransactions: boolean;
  offlineMode: boolean;
  basicReports: boolean;
  advancedReports: boolean;
  smsReminders: boolean;
  emailSupport: boolean;
  prioritySupport: boolean;
  dataExport: boolean;
  multiUserAccess: boolean;
  apiAccess: boolean;
  customIntegrations: boolean;
  whiteLabel: boolean;
  pwaInstall: boolean;
  themeChange: boolean;
  customFields: boolean;
}

// Fallback features (used when config service fails)
const DEFAULT_FEATURES: PlanFeatures = {
  maxCustomers: 5,
  unlimitedTransactions: true,
  offlineMode: true,
  basicReports: true,
  advancedReports: false,
  smsReminders: false,
  emailSupport: true,
  prioritySupport: false,
  dataExport: false,
  multiUserAccess: false,
  apiAccess: false,
  customIntegrations: false,
  whiteLabel: false,
  pwaInstall: false,
  themeChange: false,
  customFields: false,
};

export const subscriptionsService = {
  /**
   * Get plan features from config service
   */
  async getPlanFeatures(plan: SubscriptionPlan): Promise<PlanFeatures> {
    try {
      const config = await configService.getPlanConfig(plan);
      const isPaidPlan = plan === "pro" || plan === "enterprise";

      return {
        maxCustomers: config.customerLimit,
        ...config.features,
        // Ensure customFields is enabled for paid plans (in case config is missing it)
        customFields: config.features.customFields ?? isPaidPlan,
      };
    } catch (error) {
      console.error("Failed to fetch plan config, using defaults:", error);
      return DEFAULT_FEATURES;
    }
  },

  /**
   * Get user's current subscription
   * Uses secure API route (server-side JWT validation)
   */
  async getSubscription(_userId: string): Promise<SubscriptionWithFeatures | null> {
    const response = await fetch("/api/subscription", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch subscription");
    }

    const data = await response.json();
    return data.subscription;
  },

  /**
   * Update user's subscription plan
   * Uses secure API route (server-side JWT validation)
   */
  async updatePlan(_userId: string, plan: SubscriptionPlan): Promise<SubscriptionWithFeatures> {
    const response = await fetch("/api/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to update subscription");
    }

    const data = await response.json();
    return data.subscription;
  },

  /**
   * Check if user has access to a specific feature
   * Uses secure API route (server-side JWT validation)
   */
  async hasFeature(userId: string, feature: keyof PlanFeatures): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;

    const featureValue = subscription.features[feature];

    // For numeric features (like maxCustomers), null means unlimited, any number means limited access
    if (featureValue === null) return true;
    if (typeof featureValue === "number") {
      return featureValue > 0;
    }

    return featureValue === true;
  },

  /**
   * Get customer limit for user's plan
   * Uses secure API route (server-side JWT validation)
   */
  async getCustomerLimit(userId: string): Promise<number | null> {
    const subscription = await this.getSubscription(userId);
    return subscription?.features.maxCustomers ?? 5;
  },

  /**
   * Check if user is on a paid plan (pro or enterprise)
   * Uses secure API route (server-side JWT validation)
   */
  async isPaidPlan(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;
    return subscription.plan !== "free";
  },

  /**
   * Cancel subscription at period end
   * Uses secure API route (server-side JWT validation)
   */
  async cancelAtPeriodEnd(_userId: string): Promise<void> {
    const response = await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "cancel" }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to cancel subscription");
    }
  },

  /**
   * Reactivate a cancelled subscription
   * Uses secure API route (server-side JWT validation)
   */
  async reactivate(_userId: string): Promise<void> {
    const response = await fetch("/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "reactivate" }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please sign in to continue.");
      }
      const error = await response.json();
      throw new Error(error.error || "Failed to reactivate subscription");
    }
  },

  /**
   * Get current SMS usage and limit
   * Uses secure API route (server-side JWT validation)
   */
  async getSmsUsage(userId: string): Promise<{ used: number; limit: number }> {
    const subscription = await this.getSubscription(userId);
    return {
      used: subscription?.sms_used ?? 0,
      limit: subscription?.sms_limit ?? 0,
    };
  },
};
