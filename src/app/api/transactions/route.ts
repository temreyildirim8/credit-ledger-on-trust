import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api/protection";
import { validate } from "@/lib/api/validation";
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionDeleteSchema,
} from "@/lib/api/validation";
import type { Database } from "@/lib/database.types";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

/**
 * GET /api/transactions
 * Returns the authenticated user's transactions
 *
 * Query Parameters:
 * - customerId: Filter by customer ID (optional)
 * - limit: Maximum number of results (optional, default: 100)
 * - offset: Offset for pagination (optional, default: 0)
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - Only returns transactions belonging to the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) {
      return auth.response;
    }
    const { userId } = auth;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query
    let query = supabase
      .from("transactions")
      .select(
        `
        id,
        customer_id,
        type,
        amount,
        description,
        transaction_date,
        created_at,
        customers (
          name
        )
      `
      )
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply customer filter if provided
    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error fetching transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions. Please try again." },
        { status: 500 }
      );
    }

    // Transform data to include customer_name
    const transactions = (data || []).map((t) => ({
      id: t.id,
      customer_id: t.customer_id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      transaction_date: t.transaction_date,
      created_at: t.created_at,
      customer_name: t.customers?.name,
    }));

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Unexpected error in /api/transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 *
 * Request body:
 * - customerId: string (required)
 * - type: "debt" | "payment" (required)
 * - amount: number (required)
 * - note?: string (optional)
 * - date?: string (optional, defaults to now)
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - Verifies the customer belongs to the user before creating
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
    const validation = validate(transactionCreateSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { customerId, type, amount, note, date } = validation.data;

    // SECURITY: Verify the customer belongs to the user
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("user_id", userId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Customer not found or access denied." },
        { status: 404 }
      );
    }

    // Create the transaction
    const insertData: TransactionInsert = {
      user_id: userId,
      customer_id: customerId,
      type,
      amount,
      description: note || null,
      transaction_date: date || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database error creating transaction:", error);
      return NextResponse.json(
        { error: "Failed to create transaction. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/transactions
 * Update an existing transaction
 *
 * Request body:
 * - transactionId: string (required)
 * - customerId?: string (optional)
 * - type?: "debt" | "payment" (optional)
 * - amount?: number (optional)
 * - note?: string (optional)
 * - date?: string (optional)
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
    const validation = validate(transactionUpdateSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { transactionId, customerId, type, amount, note, date } = validation.data;

    // If customerId is being changed, verify the new customer belongs to the user
    if (customerId) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", customerId)
        .eq("user_id", userId)
        .single();

      if (customerError || !customer) {
        return NextResponse.json(
          { error: "Customer not found or access denied." },
          { status: 404 }
        );
      }
    }

    // Build update object
    const updateData: TransactionUpdate = {};
    if (customerId) updateData.customer_id = customerId;
    if (type) updateData.type = type;
    if (amount !== undefined) updateData.amount = amount;
    if (note !== undefined) updateData.description = note || null;
    if (date) updateData.transaction_date = date;

    // SECURITY: Update with user_id check for IDOR protection
    const { data, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId)
      .eq("user_id", userId) // IDOR protection
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Transaction not found or access denied." },
          { status: 404 }
        );
      }
      console.error("Database error updating transaction:", error);
      return NextResponse.json(
        { error: "Failed to update transaction. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ transaction: data });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions
 * Delete a transaction
 *
 * Request body:
 * - transactionId: string (required)
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - Verifies ownership before deleting (IDOR protection)
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
    const validation = validate(transactionDeleteSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { transactionId } = validation.data;

    // SECURITY: Delete with user_id check for IDOR protection
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("user_id", userId); // IDOR protection

    if (error) {
      console.error("Database error deleting transaction:", error);
      return NextResponse.json(
        { error: "Failed to delete transaction. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
