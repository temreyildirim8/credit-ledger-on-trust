import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api/protection";

/**
 * GET /api/dashboard/activity?limit=5
 * Returns the authenticated user's recent transaction activity
 * This endpoint is the secure replacement for direct browser access to transactions view
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - Calls SECURITY DEFINER function that validates auth.uid() == p_user_id
 * - No anon key or browser client involved in data access
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "5", 10);

    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid limit parameter. Must be between 1 and 50." },
        { status: 400 },
      );
    }

    // Create server-side Supabase client
    const supabase = await createClient();

    // Authenticate user using protection helper
    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    // Call the SECURITY DEFINER function
    // This function internally checks that auth.uid() == p_user_id
    const { data, error } = await supabase.rpc("get_recent_activity", {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      console.error("Database error fetching recent activity:", error);
      return NextResponse.json(
        { error: "Failed to fetch recent activity. Please try again." },
        { status: 500 },
      );
    }

    // Return the activity data (empty array if no data)
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Unexpected error in /api/dashboard/activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
