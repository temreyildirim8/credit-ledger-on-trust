import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
 *
 * Security:
 * - JWT is validated server-side via createClient()
 * - Calls SECURITY DEFINER function that validates auth.uid() == p_user_id
 * - No anon key or browser client involved in data access
 */
export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client - this validates the JWT from cookies
    const supabase = await createClient();

    // Get the authenticated user - server-side validation
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to continue." },
        { status: 401 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    // Call the SECURITY DEFINER function with includeArchived parameter
    // This function internally checks that auth.uid() == p_user_id
    const { data, error } = await supabase.rpc("get_customer_balances", {
      p_user_id: user.id,
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
        p_user_id: user.id,
      },
    );

    if (countError) {
      console.error("Database error fetching customer count:", countError);
      // Don't fail the whole request, just log the error
    }

    const totalCount = totalCountData ?? data?.length ?? 0;

    // Return the customer balances with total count
    return NextResponse.json({
      customers: data ?? [],
      totalCount,
    });
  } catch (error) {
    console.error("Unexpected error in /api/customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
