import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  subscriptionUtils,
  checkFeatureAccess,
  type ServerPlanFeatures,
} from "@/lib/api/subscription-utils";

/**
 * Authentication result from requireAuth
 */
export interface AuthResult {
  success: true;
  userId: string;
  supabase: SupabaseClient<Database>;
}

export interface AuthError {
  success: false;
  response: NextResponse;
}

/**
 * Require authentication in an API route
 * Returns the user ID and supabase client if authenticated, or an error response
 *
 * @example
 * const auth = await requireAuth(supabase);
 * if (!auth.success) return auth.response;
 * const { userId } = auth;
 */
export async function requireAuth(
  supabase: SupabaseClient<Database>,
): Promise<AuthResult | AuthError> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized. Please sign in to continue." },
        { status: 401 },
      ),
    };
  }

  return {
    success: true,
    userId: user.id,
    supabase,
  };
}

/**
 * Feature protection result
 */
export interface FeatureProtectionResult {
  allowed: boolean;
  error?: NextResponse;
  subscription?: Awaited<
    ReturnType<typeof subscriptionUtils.getSubscription>
  >;
}

/**
 * Require a specific Pro feature in an API route
 * Returns the subscription if allowed, or an error response if not
 *
 * @example
 * const protection = await requireFeature(supabase, userId, "dataExport");
 * if (!protection.allowed) return protection.error;
 * // Continue with Pro feature logic
 */
export async function requireFeature(
  supabase: SupabaseClient<Database>,
  userId: string,
  feature: keyof ServerPlanFeatures,
): Promise<FeatureProtectionResult> {
  const check = await checkFeatureAccess(supabase, userId, feature);

  if (!check.allowed) {
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: check.error,
          upgradeRequired: check.upgradeRequired,
        },
        { status: 403 },
      ),
    };
  }

  const subscription = await subscriptionUtils.getSubscription(
    supabase,
    userId,
  );

  return {
    allowed: true,
    subscription,
  };
}

/**
 * Require a paid plan (Pro or Enterprise) in an API route
 *
 * @example
 * const protection = await requirePaidPlan(supabase, userId);
 * if (!protection.allowed) return protection.error;
 */
export async function requirePaidPlan(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FeatureProtectionResult> {
  const isPaid = await subscriptionUtils.isPaidPlan(supabase, userId);

  if (!isPaid) {
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: "This feature requires a paid subscription. Please upgrade to access.",
          upgradeRequired: "pro",
        },
        { status: 403 },
      ),
    };
  }

  const subscription = await subscriptionUtils.getSubscription(
    supabase,
    userId,
  );

  return {
    allowed: true,
    subscription,
  };
}

/**
 * Require Pro plan or higher in an API route
 *
 * @example
 * const protection = await requireProPlan(supabase, userId);
 * if (!protection.allowed) return protection.error;
 */
export async function requireProPlan(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FeatureProtectionResult> {
  const isPro = await subscriptionUtils.isProPlan(supabase, userId);

  if (!isPro) {
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: "This feature requires a Pro subscription. Please upgrade to access.",
          upgradeRequired: "pro",
        },
        { status: 403 },
      ),
    };
  }

  const subscription = await subscriptionUtils.getSubscription(
    supabase,
    userId,
  );

  return {
    allowed: true,
    subscription,
  };
}

/**
 * Check customer limit before creating a new customer
 *
 * @example
 * const limitCheck = await checkCustomerLimit(supabase, userId, currentCount);
 * if (!limitCheck.allowed) return limitCheck.error;
 */
export async function checkCustomerLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  currentCount: number,
): Promise<FeatureProtectionResult> {
  const limit = await subscriptionUtils.getCustomerLimitForUser(
    supabase,
    userId,
  );

  // null means unlimited
  if (limit === null) {
    return { allowed: true };
  }

  if (currentCount >= limit) {
    const subscription = await subscriptionUtils.getSubscription(
      supabase,
      userId,
    );

    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: `You have reached your customer limit of ${limit}. Please upgrade to add more customers.`,
          currentCount,
          limit,
          upgradeRequired: subscription?.plan === "free" ? "basic" : "pro",
        },
        { status: 403 },
      ),
      subscription,
    };
  }

  return { allowed: true };
}
