import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback page
 * Handles:
 * - Email verification and OTP flows (PKCE token verification)
 * - OAuth callbacks (Google, etc.)
 * - Password reset callbacks
 */
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = params.code as string;
  const token = params.token as string;
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

  const supabase = await createClient();

  // Handle OAuth callback with code exchange
  if (code) {
    try {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError);
        redirect(`/login?error=oauth_failed`);
      }

      // Get the user to check onboarding status
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

  // Handle PKCE token verification for email confirmation
  // This handles the verification link from signup emails
  if (token && type) {
    try {
      // Verify the OTP token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as "signup" | "email_change" | "recovery" | "magiclink",
      });

      if (verifyError) {
        console.error("Token verification error:", verifyError);

        // Handle specific error cases
        if (verifyError.message?.includes("expired")) {
          redirect(`/login?error=otp_expired`);
        }

        redirect(`/login?error=verification_failed`);
      }

      // Get the user after verification
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user has a profile and completed onboarding
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        // Determine redirect path based on type
        let redirectPath = next || "/dashboard";

        if (type === "recovery") {
          // Password reset flow - redirect to reset password page
          redirectPath = "/reset-password";
        } else if (!profile || !profile.onboarding_completed) {
          redirectPath = "/onboarding";
        }

        redirect(redirectPath);
      }

      // If no user but verification succeeded, redirect to login with success
      redirect(`/login?verified=true`);
    } catch (err) {
      console.error("Token verification error:", err);
      redirect(`/login?error=verification_failed`);
    }
  }

  // If type is signup without token (legacy flow)
  if (type === "signup") {
    redirect("/login?verified=true");
  }

  // Default redirect to login
  redirect("/login");
}
