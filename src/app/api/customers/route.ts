import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api/protection";
import { serverSubscriptionService } from "@/lib/services/server-subscription.service";

/**
 * GET /api/customers
 * Returns the authenticated user's customer balances
 * This endpoint is the secure replacement for direct browser access to customer_balances view
 *
 * Query Parameters:
 * - includeArchived: "true" to include archived customers (default: false)
 *
 * Response:
 * - customers: Array of customer objects
 * - totalCount: Total customer count (including archived) for plan limit checking
 * - subscription: Subscription info with limits
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - Calls SECURITY DEFINER function that validates auth.uid() == p_user_id
 * - Returns subscription limits for frontend limit checking
 */
export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = await createClient();

    // Authenticate user using protection helper
    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    // Call the SECURITY DEFINER function with includeArchived parameter
    // This function internally checks that auth.uid() == p_user_id
    const { data, error } = await supabase.rpc("get_customer_balances", {
      p_user_id: userId,
      p_include_archived: includeArchived,
    });

    if (error) {
      console.error("Database error fetching customers:", error);
      return NextResponse.json(
        { error: "Failed to fetch customers. Please try again." },
        { status: 500 },
      );
    }

    // Get total customer count (including archived) for plan limit checking
    const { data: totalCountData, error: countError } = await supabase.rpc(
      "get_total_customer_count",
      {
        p_user_id: userId,
      },
    );

    if (countError) {
      console.error("Database error fetching customer count:", countError);
      // Don't fail the whole request, just log the error
    }

    const totalCount = totalCountData ?? data?.length ?? 0;

    // Get subscription info for limit checking
    const subscription = await serverSubscriptionService.getSubscription(
      supabase,
      userId,
    );
    const customerLimit = subscription?.features.maxCustomers ?? 5;

    // Return the customer balances with total count and subscription limits
    return NextResponse.json({
      customers: data ?? [],
      totalCount,
      subscription: {
        plan: subscription?.plan ?? "free",
        customerLimit,
        customersUsed: totalCount,
        customersRemaining:
          customerLimit === null ? null : Math.max(0, customerLimit - totalCount),
      },
    });
  } catch (error) {
    console.error("Unexpected error in /api/customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
