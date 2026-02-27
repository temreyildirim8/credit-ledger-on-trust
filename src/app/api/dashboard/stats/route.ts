import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/dashboard/stats
 * Returns the authenticated user's dashboard statistics
 * This endpoint is the secure replacement for direct browser access to customer_balances view
 *
 * Security:
 * - JWT is validated server-side via createClient()
 * - Calls SECURITY DEFINER function that validates auth.uid() == p_user_id
 * - No anon key or browser client involved in data access
 */
export async function GET(_request: NextRequest) {
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

    // Call the SECURITY DEFINER function
    // This function internally checks that auth.uid() == p_user_id
    const { data, error } = await supabase.rpc("get_dashboard_stats", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Database error fetching dashboard stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch dashboard stats. Please try again." },
        { status: 500 },
      );
    }

    // The function returns an array with one row
    const stats = data?.[0];

    if (!stats) {
      // Return default values if no stats found
      return NextResponse.json({
        totalDebt: 0,
        totalCollected: 0,
        activeCustomers: 0,
        totalTransactions: 0,
      });
    }

    return NextResponse.json({
      totalDebt: stats.total_debt ?? 0,
      totalCollected: stats.total_collected ?? 0,
      activeCustomers: stats.active_customers ?? 0,
      totalTransactions: stats.total_transactions ?? 0,
    });
  } catch (error) {
    console.error("Unexpected error in /api/dashboard/stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
