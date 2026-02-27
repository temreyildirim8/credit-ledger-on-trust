import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db-types";
import type { SubscriptionPlan, TablesInsert } from "@/lib/database.types";

export interface ServerPlanFeatures {
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

export interface ServerSubscription {
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
  features: ServerPlanFeatures;
}

// Default features for each plan (fallback when config unavailable)
const DEFAULT_PLAN_FEATURES: Record<SubscriptionPlan, ServerPlanFeatures> = {
  free: {
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
  },
  pro: {
    maxCustomers: 500,
    unlimitedTransactions: true,
    offlineMode: true,
    basicReports: true,
    advancedReports: true,
    smsReminders: true,
    emailSupport: true,
    prioritySupport: true,
    dataExport: true,
    multiUserAccess: true,
    apiAccess: true,
    customIntegrations: true,
    whiteLabel: false,
    pwaInstall: true,
    themeChange: true,
    customFields: true,
  },
  enterprise: {
    maxCustomers: null, // unlimited
    unlimitedTransactions: true,
    offlineMode: true,
    basicReports: true,
    advancedReports: true,
    smsReminders: true,
    emailSupport: true,
    prioritySupport: true,
    dataExport: true,
    multiUserAccess: true,
    apiAccess: true,
    customIntegrations: true,
    whiteLabel: true,
    pwaInstall: true,
    themeChange: true,
    customFields: true,
  },
};

/**
 * Server-side subscription service for API routes
 * Uses the server Supabase client (passed as parameter)
 */
export const serverSubscriptionService = {
  /**
   * Get plan features from config or fallback to defaults
   */
  async getPlanFeatures(
    supabase: SupabaseClient<Database>,
    plan: SubscriptionPlan,
  ): Promise<ServerPlanFeatures> {
    try {
      const { data, error } = await supabase
        .from("config")
        .select("value")
        .eq("key", `plans.${plan}.features`)
        .single();

      if (error || !data?.value) {
        return DEFAULT_PLAN_FEATURES[plan];
      }

      // Parse value if it's a string
      let features = data.value;
      if (typeof features === "string") {
        try {
          features = JSON.parse(features);
        } catch {
          return DEFAULT_PLAN_FEATURES[plan];
        }
      }

      return {
        ...DEFAULT_PLAN_FEATURES[plan],
        ...(features as Partial<ServerPlanFeatures>),
      };
    } catch {
      return DEFAULT_PLAN_FEATURES[plan];
    }
  },

  /**
   * Get customer limit for a plan
   */
  async getCustomerLimit(
    supabase: SupabaseClient<Database>,
    plan: SubscriptionPlan,
  ): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from("config")
        .select("value")
        .eq("key", `plans.${plan}.customer_limit`)
        .single();

      if (error || !data?.value) {
        return DEFAULT_PLAN_FEATURES[plan].maxCustomers;
      }

      const value = data.value;
      if (value === null || value === "null" || value === "unlimited") {
        return null;
      }

      const limit =
        typeof value === "number" ? value : parseInt(String(value), 10);
      return isNaN(limit) ? DEFAULT_PLAN_FEATURES[plan].maxCustomers : limit;
    } catch {
      return DEFAULT_PLAN_FEATURES[plan].maxCustomers;
    }
  },

  /**
   * Get user's current subscription with features
   * Creates a free subscription if none exists
   */
  async getSubscription(
    supabase: SupabaseClient<Database>,
    userId: string,
  ): Promise<ServerSubscription | null> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no subscription exists, create a free one
      if (error.code === "PGRST116") {
        return this.createFreeSubscription(supabase, userId);
      }
      console.error("Error fetching subscription:", error);
      return null;
    }

    const features = await this.getPlanFeatures(supabase, data.plan);

    return {
      ...data,
      features,
    };
  },

  /**
   * Create a free subscription for new users
   */
  async createFreeSubscription(
    supabase: SupabaseClient<Database>,
    userId: string,
  ): Promise<ServerSubscription> {
    const insertData: TablesInsert<"subscriptions"> = {
      user_id: userId,
      plan: "free",
      status: "active",
      sms_limit: 0,
      sms_used: 0,
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating free subscription:", error);
      // Return a mock subscription with free features
      return {
        id: "",
        user_id: userId,
        plan: "free",
        status: "active",
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        sms_limit: 0,
        sms_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        features: DEFAULT_PLAN_FEATURES.free,
      };
    }

    const features = await this.getPlanFeatures(supabase, "free");

    return {
      ...data,
      features,
    };
  },

  /**
   * Check if user has access to a specific feature
   */
  async hasFeature(
    supabase: SupabaseClient<Database>,
    userId: string,
    feature: keyof ServerPlanFeatures,
  ): Promise<boolean> {
    const subscription = await this.getSubscription(supabase, userId);
    if (!subscription) return false;

    const featureValue = subscription.features[feature];

    // For numeric features (like maxCustomers), null means unlimited
    if (featureValue === null) return true;
    if (typeof featureValue === "number") {
      return featureValue > 0;
    }

    return featureValue === true;
  },

  /**
   * Check if user is on a paid plan (pro or enterprise)
   */
  async isPaidPlan(
    supabase: SupabaseClient<Database>,
    userId: string,
  ): Promise<boolean> {
    const subscription = await this.getSubscription(supabase, userId);
    if (!subscription) return false;
    return subscription.plan !== "free";
  },

  /**
   * Check if user is on pro plan or higher
   */
  async isProPlan(
    supabase: SupabaseClient<Database>,
    userId: string,
  ): Promise<boolean> {
    const subscription = await this.getSubscription(supabase, userId);
    if (!subscription) return false;
    return subscription.plan === "pro" || subscription.plan === "enterprise";
  },

  /**
   * Get customer limit for user's plan
   */
  async getCustomerLimitForUser(
    supabase: SupabaseClient<Database>,
    userId: string,
  ): Promise<number | null> {
    const subscription = await this.getSubscription(supabase, userId);
    return subscription?.features.maxCustomers ?? 5;
  },
};

/**
 * Feature check result for API responses
 */
export interface FeatureCheckResult {
  allowed: boolean;
  error?: string;
  upgradeRequired?: SubscriptionPlan;
}

/**
 * Pro features that require paid plan
 */
export const PRO_FEATURES: (keyof ServerPlanFeatures)[] = [
  "advancedReports",
  "smsReminders",
  "prioritySupport",
  "dataExport",
  "multiUserAccess",
  "apiAccess",
  "customIntegrations",
  "pwaInstall",
  "themeChange",
  "customFields",
];

/**
 * Enterprise-only features
 */
export const ENTERPRISE_FEATURES: (keyof ServerPlanFeatures)[] = [
  "whiteLabel",
];

/**
 * Helper to check feature access and return appropriate response
 * Use this in API routes to validate Pro features
 */
export async function checkFeatureAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  feature: keyof ServerPlanFeatures,
): Promise<FeatureCheckResult> {
  const hasAccess = await serverSubscriptionService.hasFeature(
    supabase,
    userId,
    feature,
  );

  if (hasAccess) {
    return { allowed: true };
  }

  // Determine upgrade requirement
  const isEnterpriseFeature = ENTERPRISE_FEATURES.includes(feature);
  const upgradeRequired: SubscriptionPlan = isEnterpriseFeature
    ? "enterprise"
    : "pro";

  return {
    allowed: false,
    error: `This feature requires a ${upgradeRequired} subscription. Please upgrade to access.`,
    upgradeRequired,
  };
}
