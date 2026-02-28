import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Browser client using @supabase/ssr
 * Persists auth session in cookies so middleware can read it
 */

/**
 * Singleton browser client instance for backward compatibility
 * Use this for direct imports in services and hooks
 */
export const supabase: SupabaseClient<Database> = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
);

/**
 * Browser client function - for use when you need a fresh client instance
 */
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
