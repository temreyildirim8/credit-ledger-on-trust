"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/hooks/useAuth";
import { authService } from "@/lib/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, MailCheck, Mail, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);
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
      // Show specific alert for expired OTP
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
        return;
      }

      // Redirect to the page user was trying to access, or dashboard
      const redirectTo = redirectParam || `/${locale}/dashboard`;
      console.log("[LoginForm] Redirecting to:", redirectTo);
      router.replace(redirectTo);
    } catch (error: any) {
      const errorCode = error?.code || error?.status;
      const errorMessage =
        error?.message || t("login.error") || "Invalid email or password";

      // Handle email not confirmed error specifically
      if (errorCode === "email_not_confirmed") {
        setAuthError({
          code: "email_not_confirmed",
          message: errorMessage,
        });
      } else {
        toast.error(errorMessage);
      }
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
    } catch (error: any) {
      toast.error(
        error.message || t("login.resendError") || "Failed to send email",
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
    } catch (error: any) {
      toast.error(
        error.message || t("login.resendError") || "Failed to send email",
      );
    } finally {
      setResendingOtpEmail(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
                  <Label htmlFor="otp-email">
                    {t("otpExpired.enterEmail")}
                  </Label>
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

          <div className="space-y-2">
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("login.password")}</Label>
              <a
                href={`/${locale}/forgot-password`}
                className="text-sm text-primary hover:underline"
              >
                {t("login.forgotPassword")}
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder={t("login.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("login.submit")}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t("login.noAccount")}{" "}
            <a
              href={`/${locale}/signup`}
              className="text-primary hover:underline"
            >
              {t("login.signUp")}
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
