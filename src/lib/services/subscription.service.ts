import { supabase } from '@/lib/supabase/client';
import type { Subscription, SubscriptionPlan, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { configService } from './config.service';

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
      return {
        maxCustomers: config.customerLimit,
        ...config.features,
      };
    } catch (error) {
      console.error('Failed to fetch plan config, using defaults:', error);
      return DEFAULT_FEATURES;
    }
  },

  /**
   * Get user's current subscription
   * Creates a free subscription if none exists
   */
  async getSubscription(userId: string): Promise<SubscriptionWithFeatures | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no subscription exists, create a free one
      if (error.code === 'PGRST116') {
        return this.createFreeSubscription(userId);
      }
      throw error;
    }

    const features = await this.getPlanFeatures(data.plan);

    return {
      ...data,
      features,
    };
  },

  /**
   * Create a free subscription for new users
   */
  async createFreeSubscription(userId: string): Promise<SubscriptionWithFeatures> {
    const insertData: TablesInsert<'subscriptions'> = {
      user_id: userId,
      plan: 'free',
      status: 'active',
      sms_limit: 0,
      sms_used: 0,
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    const features = await this.getPlanFeatures('free');

    return {
      ...data,
      features,
    };
  },

  /**
   * Update user's subscription plan
   */
  async updatePlan(userId: string, plan: SubscriptionPlan): Promise<SubscriptionWithFeatures> {
    const updateData: TablesUpdate<'subscriptions'> = {
      plan,
      // Update SMS limit based on plan
      sms_limit: plan === 'pro' || plan === 'enterprise' ? 100 : 0,
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    const features = await this.getPlanFeatures(plan);

    return {
      ...data,
      features,
    };
  },

  /**
   * Check if user has access to a specific feature
   */
  async hasFeature(userId: string, feature: keyof PlanFeatures): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;

    const featureValue = subscription.features[feature];

    // For numeric features (like maxCustomers), null means unlimited, any number means limited access
    if (featureValue === null) return true;
    if (typeof featureValue === 'number') {
      return featureValue > 0;
    }

    return featureValue === true;
  },

  /**
   * Get customer limit for user's plan
   * Returns null for unlimited, or a number for limited plans
   */
  async getCustomerLimit(userId: string): Promise<number | null> {
    const subscription = await this.getSubscription(userId);
    return subscription?.features.maxCustomers ?? 5;
  },

  /**
   * Check if user is on a paid plan (pro or enterprise)
   */
  async isPaidPlan(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;
    return subscription.plan !== 'free';
  },

  /**
   * Increment SMS usage count
   */
  async incrementSmsUsage(userId: string): Promise<void> {
    // Get current usage
    const { data } = await supabase
      .from('subscriptions')
      .select('sms_used')
      .eq('user_id', userId)
      .single();

    if (data) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ sms_used: (data.sms_used || 0) + 1 })
        .eq('user_id', userId);

      if (error) throw error;
    }
  },

  /**
   * Get current SMS usage and limit
   */
  async getSmsUsage(userId: string): Promise<{ used: number; limit: number }> {
    const subscription = await this.getSubscription(userId);
    return {
      used: subscription?.sms_used ?? 0,
      limit: subscription?.sms_limit ?? 0,
    };
  },

  /**
   * Cancel subscription at period end
   */
  async cancelAtPeriodEnd(userId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Reactivate a cancelled subscription
   */
  async reactivate(userId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('user_id', userId);

    if (error) throw error;
  },
};
