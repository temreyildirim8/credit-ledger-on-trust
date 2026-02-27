import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api/protection";
import { subscriptionUtils } from "@/lib/api/subscription-utils";
import type { SubscriptionPlan } from "@/lib/database.types";

/**
 * GET /api/config
 * Returns config values
 *
 * Query Parameters:
 * - key: Get a single config value by key (optional)
 * - prefix: Get multiple config values by key prefix (optional)
 * - plan: Get plan config (customer_limit + features) (optional)
 *
 * Security:
 * - Public config values are accessible without auth
 * - Plan configs are accessible to all authenticated users
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const key = searchParams.get("key");
    const prefix = searchParams.get("prefix");
    const plan = searchParams.get("plan") as SubscriptionPlan | null;

    // Get single config value by key
    if (key) {
      const { data, error } = await supabase
        .from("config")
        .select("value")
        .eq("key", key)
        .single();

      if (error) {
        console.error(`Failed to fetch config: ${key}`, error);
        return NextResponse.json({ value: null });
      }

      // Parse value if it's a JSON string
      let value = data?.value;
      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      return NextResponse.json({ value });
    }

    // Get multiple config values by prefix
    if (prefix) {
      const { data, error } = await supabase
        .from("config")
        .select("key, value")
        .like("key", `${prefix}%`);

      if (error) {
        console.error(`Failed to fetch config by prefix: ${prefix}`, error);
        return NextResponse.json({ configs: {} });
      }

      const result: Record<string, unknown> = {};
      for (const row of data || []) {
        let value = row.value;
        if (typeof value === "string") {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if not valid JSON
          }
        }
        result[row.key] = value;
      }

      return NextResponse.json({ configs: result });
    }

    // Get plan configuration
    if (plan) {
      if (!["free", "pro", "enterprise"].includes(plan)) {
        return NextResponse.json(
          { error: "Invalid plan. Must be free, pro, or enterprise." },
          { status: 400 }
        );
      }

      const [customerLimit, features] = await Promise.all([
        subscriptionUtils.getCustomerLimit(supabase, plan),
        subscriptionUtils.getPlanFeatures(supabase, plan),
      ]);

      return NextResponse.json({
        config: {
          customerLimit,
          features,
        },
      });
    }

    // No parameters - return error
    return NextResponse.json(
      { error: "Please provide key, prefix, or plan parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Unexpected error in GET /api/config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
