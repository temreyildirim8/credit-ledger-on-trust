"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/hooks/useAuth";
import { authService } from "@/lib/services/auth.service";
import { userProfilesService } from "@/lib/services/user-profiles.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  MailCheck,
  Clock,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Image from "next/image";

type AuthError = {
  code?: string;
  message: string;
} | null;

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authError, setAuthError] = useState<AuthError>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [otpExpiredEmail, setOtpExpiredEmail] = useState("");
  const [resendingOtpEmail, setResendingOtpEmail] = useState(false);

  // Extract locale from pathname
  const segments = pathname.split("/");
  const locale = segments[1] || "en";
  const redirectParam = searchParams.get("redirect");

  // Check for verified or error params in URL
  useEffect(() => {
    const verified = searchParams.get("verified");
    const error = searchParams.get("error");

    if (verified === "true") {
      toast.success(
        t("login.verifiedSuccess") ||
          "Email verified successfully! You can now sign in.",
      );
      router.replace(`/${locale}/login`);
    }

    if (error === "otp_expired") {
      setOtpExpiredEmail(email);
      router.replace(`/${locale}/login`);
    }

    if (error === "verification_failed") {
      toast.error(
        t("login.verificationFailed") ||
          "Email verification failed. Please try again.",
      );
      router.replace(`/${locale}/login`);
    }
  }, [searchParams, router, email, locale, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      console.log("[LoginForm] Calling signIn...");
      await signIn(email, password);
      console.log(
        "[LoginForm] Sign in successful, waiting for auth state update...",
      );
      toast.success(t("login.success") || "Signed in successfully");

      // Show full-page redirecting overlay
      setIsRedirecting(true);

      // Wait for auth state to propagate through context
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if user is actually authenticated before redirecting
      const currentUser = await authService.getCurrentUser();
      console.log("[LoginForm] Current user after sign in:", currentUser?.id);

      if (!currentUser) {
        console.error(
          "[LoginForm] No user found after sign in - auth may have failed",
        );
        toast.error(t("login.error") || "Authentication failed");
        setIsRedirecting(false);
        return;
      }

      // Check if user has completed onboarding
      const hasCompletedOnboarding =
        await userProfilesService.hasCompletedOnboarding(currentUser.id);
      console.log(
        "[LoginForm] Has completed onboarding:",
        hasCompletedOnboarding,
      );

      // Determine redirect
      let redirectTo: string;
      if (redirectParam && hasCompletedOnboarding) {
        redirectTo = redirectParam;
      } else if (!hasCompletedOnboarding) {
        redirectTo = `/${locale}/onboarding`;
      } else {
        redirectTo = `/${locale}/dashboard`;
      }
      console.log("[LoginForm] Redirecting to:", redirectTo);
      router.replace(redirectTo);
    } catch (error) {
      const errorCode =
        (error as { code?: string; status?: string })?.code ||
        (error as { code?: string; status?: string })?.status;
      const errorMessage =
        (error instanceof Error ? error.message : String(error)) ||
        t("login.error") ||
        "Invalid email or password";

      if (errorCode === "email_not_confirmed") {
        setAuthError({
          code: "email_not_confirmed",
          message: errorMessage,
        });
      } else {
        toast.error(errorMessage);
      }
      setIsRedirecting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast.error(t("login.enterEmail") || "Please enter your email address");
      return;
    }

    setResendingEmail(true);
    try {
      await authService.resendConfirmationEmail(email);
      toast.success(t("login.resendSuccess") || "Verification email resent!");
    } catch (error) {
      toast.error(
        (error instanceof Error ? error.message : String(error)) ||
          t("login.resendError") ||
          "Failed to send email",
      );
    } finally {
      setResendingEmail(false);
    }
  };

  const handleResendOtpEmail = async (resendEmail: string) => {
    if (!resendEmail) {
      toast.error(t("login.enterEmail") || "Please enter your email address");
      return;
    }

    setResendingOtpEmail(true);
    try {
      await authService.resendConfirmationEmail(resendEmail);
      toast.success(t("login.resendSuccess") || "Verification email resent!");
      setOtpExpiredEmail("");
    } catch (error) {
      toast.error(
        (error instanceof Error ? error.message : String(error)) ||
          t("login.resendError") ||
          "Failed to send email",
      );
    } finally {
      setResendingOtpEmail(false);
    }
  };

  // Show full-page overlay loader while redirecting after successful login
  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#3c83f6] mb-4" />
        <p className="text-[16px] font-medium text-[#475569]">
          {t("login.redirecting") || "Signing you in..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[32px] w-full">
      {/* Header */}
      <div className="flex flex-col gap-[8px]">
        <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
          {t("login.title")}
        </h2>
        <p className="text-[16px] leading-[24px] text-[#64748b]">
          {t("login.subtitle")}
        </p>
      </div>

      {/* Error alerts */}
      {authError?.code === "email_not_confirmed" && (
        <Alert variant="destructive">
          <MailCheck className="h-4 w-4" />
          <AlertTitle>
            {t("login.emailNotConfirmedTitle") || "Email Not Verified"}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {t("login.emailNotConfirmedDescription") ||
                "Your email address has not been verified yet. Please check your inbox and click the verification link."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={resendingEmail}
              className="w-full"
            >
              {resendingEmail && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("login.resendEmailButton") || "Resend Verification Email"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {otpExpiredEmail && (
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("otpExpired.title")}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{t("otpExpired.description")}</p>
            <div className="space-y-2">
              <Label htmlFor="otp-email">{t("otpExpired.enterEmail")}</Label>
              <Input
                id="otp-email"
                type="email"
                placeholder={t("otpExpired.emailPlaceholder")}
                value={otpExpiredEmail}
                onChange={(e) => setOtpExpiredEmail(e.target.value)}
                disabled={resendingOtpEmail}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleResendOtpEmail(otpExpiredEmail)}
                disabled={resendingOtpEmail || !otpExpiredEmail}
                className="w-full"
              >
                {resendingOtpEmail && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("otpExpired.resendButton")}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
        {/* Email field */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="email"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("login.email")}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Mail className="h-[16px] w-[16px] text-[#94a3b8]" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-[48px] pl-[41px] pr-[17px] border-[#e2e8f0] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[16px] placeholder:text-[#94a3b8] focus-visible:ring-[#3c83f6]"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-[6px]">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-[14px] font-semibold text-[#334155]"
            >
              {t("login.password")}
            </Label>
            <a
              href={`/${locale}/forgot-password`}
              className="text-[14px] font-medium text-[#3c83f6] hover:underline"
            >
              {t("login.forgotPassword")}
            </a>
          </div>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Lock className="h-[17.5px] w-[13.3px] text-[#94a3b8]" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-[48px] pl-[41px] pr-[49px] border-[#e2e8f0] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[16px] placeholder:text-[#94a3b8] focus-visible:ring-[#3c83f6]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-[12.5px] w-[18.3px]" />
              ) : (
                <Eye className="h-[12.5px] w-[18.3px]" />
              )}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
          <button
            type="submit"
            disabled={loading}
            className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("login.submit")}
          </button>
        </div>
      </form>

      {/* Google sign in */}
      <div className="flex flex-col gap-[16px]">
        <div className="flex items-center gap-[16px]">
          <div className="flex-1 h-px bg-[#e2e8f0]" />
          <span className="text-[12px] font-semibold uppercase text-[#94a3b8] whitespace-nowrap">
            {t("common.or")}
          </span>
          <div className="flex-1 h-px bg-[#e2e8f0]" />
        </div>
        <GoogleSignInButton
          redirectTo={redirectParam || `/${locale}/dashboard`}
        />
      </div>

      {/* Trust badges */}
      <div className="flex flex-col gap-[16px]">
        <div className="flex items-center gap-[16px]">
          <div className="flex-1 h-px bg-[#e2e8f0]" />
          <span className="text-[12px] font-semibold uppercase text-[#94a3b8] whitespace-nowrap">
            {t("common.trustedBy") || "Trusted By"}
          </span>
          <div className="flex-1 h-px bg-[#e2e8f0]" />
        </div>
        <div className="flex items-center justify-center gap-[24px] opacity-60">
          {/* Stripe */}
          <div className="flex items-center justify-center w-[130px]">
            <Image
              src="/images/trust-badges/stripe.svg"
              alt="Stripe"
              width={50}
              height={28}
              className="h-[20px] w-auto object-contain"
            />
          </div>
          {/* SSL */}
          <div className="flex items-center justify-center gap-[6px] w-[130px]">
            <ShieldCheck className="h-[18px] w-[18px] text-[#16a34a]" />
            <span className="text-[14px] font-bold text-[#334155] uppercase">
              SSL
            </span>
          </div>
          {/* Visa / Mastercard */}
          <div className="flex items-center justify-center gap-[4px] w-[130px]">
            <Image
              src="/images/trust-badges/visa.svg"
              alt="Visa"
              width={30}
              height={20}
              className="h-[18px] w-auto object-contain"
            />
            <Image
              src="/images/trust-badges/mastercard.svg"
              alt="Mastercard"
              width={30}
              height={20}
              className="h-[20px] w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="flex justify-center pt-[8px]">
        <p className="text-[14px] font-medium text-[#64748b] text-center">
          {t("login.noAccount")}{" "}
          <a
            href={`/${locale}/signup`}
            className="font-bold text-[#3c83f6] hover:underline"
          >
            {t("login.signUp")}
          </a>
        </p>
      </div>
    </div>
  );
}
