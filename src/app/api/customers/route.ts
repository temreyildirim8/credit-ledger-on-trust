import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/customers
 * Returns the authenticated user's customer balances
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
    const { data, error } = await supabase.rpc("get_customer_balances", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Database error fetching customers:", error);
      return NextResponse.json(
        { error: "Failed to fetch customers. Please try again." },
        { status: 500 },
      );
    }

    // Return the customer balances (empty array if no data)
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Unexpected error in /api/customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
