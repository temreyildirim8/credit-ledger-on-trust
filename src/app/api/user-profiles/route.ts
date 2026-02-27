import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api/protection";
import type { Database } from "@/lib/database.types";

type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"];
type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];

/**
 * GET /api/user-profiles
 * Returns the authenticated user's profile
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

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No profile exists yet
        return NextResponse.json({ profile: null });
      }
      console.error("Database error fetching profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("Unexpected error in GET /api/user-profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-profiles
 * Create a new user profile
 *
 * Request body:
 * - full_name?: string
 * - shop_name?: string
 * - phone?: string
 * - address?: string
 * - currency?: string (default: "TRY")
 * - language?: string (default: "en")
 * - industry?: string
 * - logo_url?: string
 * - onboarding_completed?: boolean (default: false)
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
    const {
      full_name,
      shop_name,
      phone,
      address,
      currency,
      language,
      industry,
      logo_url,
      onboarding_completed,
    } = body;

    const insertData: UserProfileInsert = {
      id: userId,
      full_name: full_name ?? null,
      shop_name: shop_name ?? null,
      phone: phone ?? null,
      address: address ?? null,
      currency: currency ?? "TRY",
      language: language ?? "en",
      industry: industry ?? null,
      logo_url: logo_url ?? null,
      onboarding_completed: onboarding_completed ?? false,
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database error creating profile:", error);
      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/user-profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user-profiles
 * Update the authenticated user's profile
 *
 * Request body:
 * - full_name?: string
 * - shop_name?: string
 * - phone?: string
 * - address?: string
 * - currency?: string
 * - language?: string
 * - industry?: string
 * - logo_url?: string
 * - onboarding_completed?: boolean
 *
 * Security:
 * - JWT is validated server-side via requireAuth()
 * - User can only update their own profile
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
    const {
      full_name,
      shop_name,
      phone,
      address,
      currency,
      language,
      industry,
      logo_url,
      onboarding_completed,
    } = body;

    const updateData: UserProfileUpdate = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (shop_name !== undefined) updateData.shop_name = shop_name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (currency !== undefined) updateData.currency = currency;
    if (language !== undefined) updateData.language = language;
    if (industry !== undefined) updateData.industry = industry;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (onboarding_completed !== undefined)
      updateData.onboarding_completed = onboarding_completed;

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }
      console.error("Database error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/user-profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
