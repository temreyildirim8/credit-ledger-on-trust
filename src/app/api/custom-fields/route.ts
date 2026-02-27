import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireFeature } from "@/lib/api/protection";

/**
 * GET /api/custom-fields
 * Returns all custom field definitions for the authenticated user
 * Pro feature - returns 403 for free users
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) return auth.response;
    const { userId } = auth;

    // Check Pro subscription
    const protection = await requireFeature(supabase, userId, "customFields");
    if (!protection.allowed) {
      return protection.error!;
    }

    const { data, error } = await supabase
      .from("custom_field_definitions")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Database error fetching custom fields:", error);
      return NextResponse.json(
        { error: "Failed to fetch custom fields" },
        { status: 500 },
      );
    }

    return NextResponse.json({ fields: data });
  } catch (error) {
    console.error("Unexpected error in GET /api/custom-fields:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/custom-fields
 * Create a new custom field definition
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) return auth.response;
    const { userId } = auth;

    const protection = await requireFeature(supabase, userId, "customFields");
    if (!protection.allowed) {
      return protection.error!;
    }

    const body = await request.json();
    const { name, field_type, options, is_required, sort_order } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Field name is required." },
        { status: 400 },
      );
    }

    if (!field_type || typeof field_type !== "string") {
      return NextResponse.json(
        { error: "Field type is required." },
        { status: 400 },
      );
    }

    // Validate field type
    const validTypes = ["text", "number", "date", "select", "textarea", "checkbox"];
    if (!validTypes.includes(field_type)) {
      return NextResponse.json(
        { error: "Invalid field type." },
        { status: 400 },
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");

    const { data, error } = await supabase
      .from("custom_field_definitions")
      .insert({
        user_id: userId,
        name: name.trim(),
        slug,
        field_type,
        options: options || [],
        is_required: is_required || false,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A field with this name already exists" },
          { status: 400 },
        );
      }
      console.error("Database error creating custom field:", error);
      return NextResponse.json(
        { error: "Failed to create custom field" },
        { status: 500 },
      );
    }

    return NextResponse.json({ field: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/custom-fields:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/custom-fields
 * Update a custom field definition
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) return auth.response;
    const { userId } = auth;

    const protection = await requireFeature(supabase, userId, "customFields");
    if (!protection.allowed) {
      return protection.error!;
    }

    const body = await request.json();
    const { id, name, options, is_required, sort_order } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Field ID is required." },
        { status: 400 },
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (options !== undefined) updateData.options = options;
    if (is_required !== undefined) updateData.is_required = is_required;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // Update with user_id check for IDOR protection
    const { data, error } = await supabase
      .from("custom_field_definitions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId) // IDOR protection
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Field not found or access denied." },
          { status: 404 },
        );
      }
      console.error("Database error updating custom field:", error);
      return NextResponse.json(
        { error: "Failed to update custom field" },
        { status: 500 },
      );
    }

    return NextResponse.json({ field: data });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/custom-fields:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/custom-fields
 * Delete a custom field definition
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const auth = await requireAuth(supabase);
    if (!auth.success) return auth.response;
    const { userId } = auth;

    const protection = await requireFeature(supabase, userId, "customFields");
    if (!protection.allowed) {
      return protection.error!;
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Field ID is required." },
        { status: 400 },
      );
    }

    // Delete with user_id check for IDOR protection
    const { error } = await supabase
      .from("custom_field_definitions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // IDOR protection

    if (error) {
      console.error("Database error deleting custom field:", error);
      return NextResponse.json(
        { error: "Failed to delete custom field" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/custom-fields:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
