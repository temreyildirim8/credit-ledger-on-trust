import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, checkCustomerLimit } from "@/lib/api/protection";
import { serverSubscriptionService } from "@/lib/services/server-subscription.service";
import type { Database } from "@/lib/database.types";

type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];

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

/**
 * POST /api/customers
 * Create a new customer
 *
 * Request body:
 * - name: string (required)
 * - phone?: string (optional)
 * - address?: string (optional)
 * - notes?: string (optional)
 * - national_id?: string (optional)
 * - custom_fields?: Record<string, unknown> (optional, Pro feature)
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - Checks customer limit based on subscription plan
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const { name, phone, address, notes, national_id, custom_fields } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Customer name is required." },
        { status: 400 }
      );
    }

    // Get current customer count for limit check
    const { data: existingCustomers } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .eq("is_deleted", false);

    const currentCount = existingCustomers?.length ?? 0;

    // Check customer limit
    const limitCheck = await checkCustomerLimit(supabase, userId, currentCount);
    if (!limitCheck.allowed) {
      return limitCheck.error!;
    }

    // Create the customer
    const insertData: CustomerInsert = {
      user_id: userId,
      name: name.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      national_id: national_id?.trim() || null,
      custom_fields: custom_fields || {},
    };

    const { data, error } = await supabase
      .from("customers")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database error creating customer:", error);
      return NextResponse.json(
        { error: "Failed to create customer. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ customer: { ...data, balance: 0 } }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customers
 * Update an existing customer
 *
 * Request body:
 * - customerId: string (required)
 * - name?: string (optional)
 * - phone?: string (optional)
 * - address?: string (optional)
 * - notes?: string (optional)
 * - national_id?: string (optional)
 * - custom_fields?: Record<string, unknown> (optional, Pro feature)
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - Verifies ownership before updating (IDOR protection)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const { customerId, name, phone, address, notes, national_id, custom_fields } = body;

    if (!customerId || typeof customerId !== "string") {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Customer name cannot be empty." },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: CustomerUpdate = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (national_id !== undefined) updateData.national_id = national_id?.trim() || null;
    if (custom_fields !== undefined) updateData.custom_fields = custom_fields;

    // SECURITY: Update with user_id check for IDOR protection
    const { data, error } = await supabase
      .from("customers")
      .update(updateData)
      .eq("id", customerId)
      .eq("user_id", userId) // IDOR protection
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Customer not found or access denied." },
          { status: 404 }
        );
      }
      console.error("Database error updating customer:", error);
      return NextResponse.json(
        { error: "Failed to update customer. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ customer: data });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers
 * Delete or archive a customer
 *
 * Request body:
 * - customerId: string (required)
 * - hardDelete: boolean (optional, default: false - soft delete/archive)
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - Verifies ownership before deleting (IDOR protection)
 * - Also deletes all transactions for hard delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    // Parse and validate request body
    const body = await request.json();
    const { customerId, hardDelete = false } = body;

    if (!customerId || typeof customerId !== "string") {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 }
      );
    }

    // SECURITY: First verify the customer belongs to the user
    const { data: customer, error: verifyError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("user_id", userId)
      .single();

    if (verifyError || !customer) {
      return NextResponse.json(
        { error: "Customer not found or access denied." },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Hard delete: First delete all transactions for this customer
      const { error: transactionsError } = await supabase
        .from("transactions")
        .delete()
        .eq("customer_id", customerId)
        .eq("user_id", userId); // IDOR protection

      if (transactionsError) {
        console.error("Database error deleting customer transactions:", transactionsError);
        return NextResponse.json(
          { error: "Failed to delete customer transactions. Please try again." },
          { status: 500 }
        );
      }

      // Then delete the customer
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId)
        .eq("user_id", userId); // IDOR protection

      if (error) {
        console.error("Database error deleting customer:", error);
        return NextResponse.json(
          { error: "Failed to delete customer. Please try again." },
          { status: 500 }
        );
      }
    } else {
      // Soft delete (archive): Just mark as deleted
      const { error } = await supabase
        .from("customers")
        .update({ is_deleted: true })
        .eq("id", customerId)
        .eq("user_id", userId); // IDOR protection

      if (error) {
        console.error("Database error archiving customer:", error);
        return NextResponse.json(
          { error: "Failed to archive customer. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
