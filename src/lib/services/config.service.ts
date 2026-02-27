import type { SubscriptionPlan } from "@/lib/database.types";

export interface PlanFeatures {
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

export interface PlanConfig {
  customerLimit: number | null; // null = unlimited
  features: PlanFeatures;
}

// Cache for config values
const configCache: Map<string, unknown> = new Map();
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const configService = {
  /**
   * Get a single config value by key
   * Uses secure API route
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    // Check cache first
    if (Date.now() < cacheExpiry && configCache.has(key)) {
      return configCache.get(key) as T;
    }

    try {
      const response = await fetch(`/api/config?key=${encodeURIComponent(key)}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.error(`Failed to fetch config: ${key}`);
        return null;
      }

      const data = await response.json();
      const value = data.value as T;

      // Update cache
      configCache.set(key, value);
      cacheExpiry = Date.now() + CACHE_TTL;

      return value;
    } catch (error) {
      console.error(`Failed to fetch config: ${key}`, error);
      return null;
    }
  },

  /**
   * Get multiple config values by key prefix
   * Uses secure API route
   */
  async getByPrefix(prefix: string): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `/api/config?prefix=${encodeURIComponent(prefix)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        console.error(`Failed to fetch config by prefix: ${prefix}`);
        return {};
      }

      const data = await response.json();
      const configs = data.configs || {};

      // Update cache
      for (const [key, value] of Object.entries(configs)) {
        configCache.set(key, value);
      }
      cacheExpiry = Date.now() + CACHE_TTL;

      return configs;
    } catch (error) {
      console.error(`Failed to fetch config by prefix: ${prefix}`, error);
      return {};
    }
  },

  /**
   * Get plan configuration (customer limit + features)
   * Uses secure API route
   */
  async getPlanConfig(plan: SubscriptionPlan): Promise<PlanConfig> {
    try {
      const response = await fetch(`/api/config?plan=${plan}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.error(`Failed to fetch plan config: ${plan}`);
        return {
          customerLimit: this.getDefaultCustomerLimit(plan),
          features: this.getDefaultFeatures(plan),
        };
      }

      const data = await response.json();
      return {
        customerLimit: data.config?.customerLimit ?? this.getDefaultCustomerLimit(plan),
        features: data.config?.features ?? this.getDefaultFeatures(plan),
      };
    } catch (error) {
      console.error(`Failed to fetch plan config: ${plan}`, error);
      return {
        customerLimit: this.getDefaultCustomerLimit(plan),
        features: this.getDefaultFeatures(plan),
      };
    }
  },

  /**
   * Get customer limit for a plan
   */
  async getCustomerLimit(plan: SubscriptionPlan): Promise<number | null> {
    const config = await this.getPlanConfig(plan);
    return config.customerLimit;
  },

  /**
   * Get features for a plan
   */
  async getPlanFeatures(plan: SubscriptionPlan): Promise<PlanFeatures> {
    const config = await this.getPlanConfig(plan);
    return config.features;
  },

  /**
   * Clear the config cache
   */
  clearCache(): void {
    configCache.clear();
    cacheExpiry = 0;
  },

  /**
   * Default customer limit (plan-specific)
   */
  getDefaultCustomerLimit(plan: SubscriptionPlan = "free"): number | null {
    switch (plan) {
      case "free":
        return 5;
      case "pro":
        return 500;
      case "enterprise":
        return null; // unlimited
      default:
        return 5;
    }
  },

  /**
   * Default features fallback (plan-specific)
   */
  getDefaultFeatures(plan: SubscriptionPlan = "free"): PlanFeatures {
    const isPaidPlan = plan === "pro" || plan === "enterprise";

    return {
      unlimitedTransactions: true,
      offlineMode: true,
      basicReports: true,
      advancedReports: isPaidPlan,
      smsReminders: false,
      emailSupport: true,
      prioritySupport: isPaidPlan,
      dataExport: isPaidPlan,
      multiUserAccess: false,
      apiAccess: false,
      customIntegrations: false,
      whiteLabel: false,
      pwaInstall: false,
      themeChange: false,
      customFields: isPaidPlan,
    };
  },
};
