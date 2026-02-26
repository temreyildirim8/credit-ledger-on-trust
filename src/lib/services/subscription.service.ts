import { supabase } from '@/lib/supabase/client';
import type { Subscription, SubscriptionPlan, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { CUSTOMER_LIMITS } from '@/lib/database.types';

export interface SubscriptionWithFeatures extends Subscription {
  features: PlanFeatures;
}

export interface PlanFeatures {
  maxCustomers: number;
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
  pwaInstall: boolean; // PWA install prompt - only for paid plans
  themeChange: boolean; // Theme toggle - only for paid plans
}

// Feature definitions by plan
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    maxCustomers: CUSTOMER_LIMITS.free,
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
    pwaInstall: false, // Free users cannot install PWA
    themeChange: false, // Free users cannot change theme
  },
  basic: {
    maxCustomers: CUSTOMER_LIMITS.basic,
    unlimitedTransactions: true,
    offlineMode: true,
    basicReports: true,
    advancedReports: true,
    smsReminders: false,
    emailSupport: true,
    prioritySupport: false,
    dataExport: true,
    multiUserAccess: false,
    apiAccess: false,
    customIntegrations: false,
    whiteLabel: false,
    pwaInstall: true, // Basic and above can install PWA
    themeChange: true, // Basic and above can change theme
  },
  pro: {
    maxCustomers: CUSTOMER_LIMITS.pro,
    unlimitedTransactions: true,
    offlineMode: true,
    basicReports: true,
    advancedReports: true,
    smsReminders: true,
    emailSupport: true,
    prioritySupport: true,
    dataExport: true,
    multiUserAccess: false,
    apiAccess: true,
    customIntegrations: false,
    whiteLabel: false,
    pwaInstall: true, // Pro can install PWA
    themeChange: true, // Pro can change theme
  },
  enterprise: {
    maxCustomers: CUSTOMER_LIMITS.enterprise,
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
    pwaInstall: true, // Enterprise can install PWA
    themeChange: true, // Enterprise can change theme
  },
};

export const subscriptionsService = {
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

    return {
      ...data,
      features: PLAN_FEATURES[data.plan],
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

    return {
      ...data,
      features: PLAN_FEATURES.free,
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

    return {
      ...data,
      features: PLAN_FEATURES[plan],
    };
  },

  /**
   * Check if user has access to a specific feature
   */
  async hasFeature(userId: string, feature: keyof PlanFeatures): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;

    const featureValue = subscription.features[feature];

    // For numeric features (like maxCustomers), having any positive number means access
    if (typeof featureValue === 'number') {
      return featureValue > 0;
    }

    return featureValue === true;
  },

  /**
   * Get customer limit for user's plan
   */
  async getCustomerLimit(userId: string): Promise<number> {
    const subscription = await this.getSubscription(userId);
    return subscription?.features.maxCustomers ?? CUSTOMER_LIMITS.free;
  },

  /**
   * Check if user is on a paid plan (basic, pro, or enterprise)
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
