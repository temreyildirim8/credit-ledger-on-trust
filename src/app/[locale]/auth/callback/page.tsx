import { redirect } from "next/navigation";

/**
 * Email verification and OTP callback page
 * This page handles redirects from Supabase email verification links
 * and OTP verification flows
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

  // If there's an error in the URL, redirect to login with error
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    // Preserve specific error codes like 'otp_expired'
    const errorParam =
      errorCode === "otp_expired" ? "otp_expired" : "verification_failed";
    redirect(`/login?error=${errorParam}`);
  }

  // If we have a code, the email was verified successfully
  // Supabase handles the actual verification before redirecting here
  if (code || type === "signup") {
    redirect("/login?verified=true");
  }

  // Default redirect to login
  redirect("/login");
}
