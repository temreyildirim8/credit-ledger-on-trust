import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api/protection";
import { subscriptionUtils } from "@/lib/api/subscription-utils";
import type { SubscriptionPlan, TablesUpdate } from "@/lib/database.types";

/**
 * GET /api/subscription
 * Returns the authenticated user's subscription with features
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    const subscription = await subscriptionUtils.getSubscription(
      supabase,
      userId
    );

    if (!subscription) {
      return NextResponse.json(
        { error: "Failed to get subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Unexpected error in GET /api/subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscription
 * Update subscription (e.g., change plan)
 *
 * Request body:
 * - plan: "free" | "pro" | "enterprise" (required)
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    const body = await request.json();
    const { plan } = body as { plan: SubscriptionPlan };

    if (!plan || !["free", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Valid plan is required (free, pro, or enterprise)" },
        { status: 400 }
      );
    }

    const updateData: TablesUpdate<"subscriptions"> = {
      plan,
      sms_limit: plan === "pro" || plan === "enterprise" ? 100 : 0,
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Database error updating subscription:", error);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    const features = await subscriptionUtils.getPlanFeatures(
      supabase,
      plan
    );

    return NextResponse.json({
      subscription: {
        ...data,
        features,
      },
    });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription
 * Cancel subscription at period end or reactivate
 *
 * Request body:
 * - action: "cancel" | "reactivate" (required)
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    const body = await request.json();
    const { action } = body as { action: "cancel" | "reactivate" };

    if (!action || !["cancel", "reactivate"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action is required (cancel or reactivate)" },
        { status: 400 }
      );
    }

    const updateData: TablesUpdate<"subscriptions"> = {
      cancel_at_period_end: action === "cancel",
    };

    const { error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("user_id", userId);

    if (error) {
      console.error("Database error updating subscription:", error);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in POST /api/subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
