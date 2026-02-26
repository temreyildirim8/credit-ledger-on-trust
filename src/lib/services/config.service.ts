import { supabase } from '@/lib/supabase/client';
import type { SubscriptionPlan } from '@/lib/database.types';

export interface ConfigRow {
  key: string;
  value: string | number | boolean | object | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

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
}

export interface PlanConfig {
  customerLimit: number | null; // null = unlimited
  features: PlanFeatures;
}

// Cache for config values
let configCache: Map<string, ConfigRow['value']> = new Map();
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const configService = {
  /**
   * Get a single config value by key
   */
  async get<T = ConfigRow['value']>(key: string): Promise<T | null> {
    // Check cache first
    if (Date.now() < cacheExpiry && configCache.has(key)) {
      return configCache.get(key) as T;
    }

    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      console.error(`Failed to fetch config: ${key}`, error);
      return null;
    }

    // Parse value if it's a JSON string
    let value = data.value;
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    // Update cache
    configCache.set(key, value);
    cacheExpiry = Date.now() + CACHE_TTL;

    return value as T;
  },

  /**
   * Get multiple config values by key prefix
   */
  async getByPrefix(prefix: string): Promise<Record<string, ConfigRow['value']>> {
    const { data, error } = await supabase
      .from('config')
      .select('key, value')
      .like('key', `${prefix}%`);

    if (error) {
      console.error(`Failed to fetch config by prefix: ${prefix}`, error);
      return {};
    }

    const result: Record<string, ConfigRow['value']> = {};
    for (const row of data) {
      let value = row.value;
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }
      result[row.key] = value;
      configCache.set(row.key, value);
    }

    cacheExpiry = Date.now() + CACHE_TTL;
    return result;
  },

  /**
   * Get plan configuration (customer limit + features)
   */
  async getPlanConfig(plan: SubscriptionPlan): Promise<PlanConfig> {
    const [limitResult, featuresResult] = await Promise.all([
      this.get<string | number>(`plans.${plan}.customer_limit`),
      this.get<PlanFeatures>(`plans.${plan}.features`),
    ]);

    // Parse customer limit
    let customerLimit: number | null = null;
    if (limitResult !== null && limitResult !== 'null') {
      customerLimit = typeof limitResult === 'number' ? limitResult : parseInt(String(limitResult), 10);
      if (isNaN(customerLimit)) customerLimit = null;
    }

    return {
      customerLimit,
      features: featuresResult ?? this.getDefaultFeatures(),
    };
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
   * Default features fallback
   */
  getDefaultFeatures(): PlanFeatures {
    return {
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
    };
  },
};
