import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback page
 * Handles:
 * - Email verification and OTP flows
 * - OAuth callbacks (Google, etc.)
 */
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = params.code as string;
  const type = params.type as string;
  const error = params.error as string;
  const errorDescription = params.error_description as string;
  const errorCode = params.error_code as string;
  const next = params.next as string;

  // If there's an error in the URL, redirect to login with error
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    // Preserve specific error codes like 'otp_expired'
    const errorParam =
      errorCode === "otp_expired" ? "otp_expired" : "verification_failed";
    redirect(`/login?error=${errorParam}`);
  }

  // Handle OAuth callback with code exchange
  if (code) {
    const supabase = await createClient();

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError);
        redirect(`/login?error=oauth_failed`);
      }

      // Get the user to check onboarding status
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if user has a profile and completed onboarding
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        // Determine redirect path
        let redirectPath = next || "/dashboard";

        if (!profile || !profile.onboarding_completed) {
          redirectPath = "/onboarding";
        }

        redirect(redirectPath);
      }
    } catch (err) {
      console.error("OAuth callback error:", err);
      redirect(`/login?error=oauth_failed`);
    }
  }

  // If type is signup (email verification link)
  if (type === "signup") {
    redirect("/login?verified=true");
  }

  // Default redirect to login
  redirect("/login");
}
