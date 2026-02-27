import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireFeature } from "@/lib/api/protection";

/**
 * POST /api/export
 * Export data in various formats (Pro feature)
 *
 * Request body:
 * - format: "csv" | "pdf"
 * - type: "transactions" | "customers" | "summary"
 * - dateRange?: { start: string; end: string }
 *
 * Security:
 * - Requires authentication (JWT validated server-side)
 * - Requires Pro subscription (dataExport feature)
 *
 * This endpoint demonstrates the pattern for protecting Pro features in API routes.
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Create server-side Supabase client
    const supabase = await createClient();

    // Step 2: Authenticate the user
    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    // Step 3: Check Pro feature access
    // This is the key security check - it validates the user's subscription
    // before allowing access to the Pro feature
    const protection = await requireFeature(supabase, userId, "dataExport");
    if (!protection.allowed) {
      return protection.error;
    }

    // Step 4: Parse and validate request body
    const body = await request.json();
    const { format, type, dateRange } = body;

    if (!format || !["csv", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be 'csv' or 'pdf'." },
        { status: 400 },
      );
    }

    if (!type || !["transactions", "customers", "summary"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'transactions', 'customers', or 'summary'." },
        { status: 400 },
      );
    }

    // Step 5: Fetch data based on type
    let data: unknown;

    switch (type) {
      case "transactions": {
        let query = supabase
          .from("transactions")
          .select(
            `
            id,
            type,
            amount,
            description,
            transaction_date,
            created_at,
            customers (name)
          `,
          )
          .eq("user_id", userId)
          .order("transaction_date", { ascending: false });

        // Apply date filter if provided
        if (dateRange?.start) {
          query = query.gte("transaction_date", dateRange.start);
        }
        if (dateRange?.end) {
          query = query.lte("transaction_date", dateRange.end);
        }

        const { data: transactions, error } = await query;
        if (error) throw error;
        data = transactions;
        break;
      }

      case "customers": {
        const { data: customers, error } = await supabase.rpc(
          "get_customer_balances",
          {
            p_user_id: userId,
            p_include_archived: false,
          },
        );
        if (error) throw error;
        data = customers;
        break;
      }

      case "summary": {
        const { data: stats, error } = await supabase.rpc("get_dashboard_stats", {
          p_user_id: userId,
        });
        if (error) throw error;
        data = stats?.[0] ?? {};
        break;
      }
    }

    // Step 6: Return the data
    // In a real implementation, you would generate the CSV/PDF here
    // For now, we return the data with format info so the client can generate the file
    return NextResponse.json({
      success: true,
      format,
      type,
      data,
      generatedAt: new Date().toISOString(),
      // Include subscription info for client-side display
      plan: protection.subscription?.plan,
    });
  } catch (error) {
    console.error("Error in /api/export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/export
 * Check if export feature is available for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    const protection = await requireFeature(supabase, userId, "dataExport");

    return NextResponse.json({
      available: protection.allowed,
      plan: protection.subscription?.plan,
      upgradeRequired: protection.allowed ? null : "pro",
    });
  } catch (error) {
    console.error("Error checking export availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
