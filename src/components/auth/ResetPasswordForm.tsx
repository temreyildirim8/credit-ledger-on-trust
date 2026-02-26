"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { authService } from "@/lib/services/auth.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

type FormState = "idle" | "loading" | "success" | "checking";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname
  const segments = pathname.split("/");
  const locale = segments[1] || "en";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formState, setFormState] = useState<FormState>("checking");
  const [error, setError] = useState<string | null>(null);

  // Parse error from URL hash fragment
  const getErrorFromHash = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    const hash = window.location.hash;
    if (!hash || hash.length < 2) return null;

    const params = new URLSearchParams(hash.substring(1));
    const urlError = params.get("error");
    const errorCode = params.get("error_code");
    const errorDescription = params.get("error_description");

    if (urlError === "access_denied") {
      switch (errorCode) {
        case "otp_expired":
          return (
            t("resetPassword.otpExpired") ||
            "Password reset link has expired. Please request a new reset link."
          );
        default:
          return (
            errorDescription ||
            t("resetPassword.invalidLink") ||
            "Invalid or expired link"
          );
      }
    }

    return errorDescription || null;
  }, [t]);

  useEffect(() => {
    const hashError = getErrorFromHash();
    if (hashError) {
      queueMicrotask(() => {
        setError(hashError);
        setFormState("idle");
      });
      window.history.replaceState(null, "", " ");
      return;
    }

    const checkSession = async () => {
      try {
        const session = await authService.getSession();
        if (!session) {
          setError(t("resetPassword.invalidLink") || "Invalid or expired link");
          setFormState("idle");
        } else {
          setFormState("idle");
        }
      } catch {
        setError(
          t("resetPassword.invalidLink") || "Session could not be verified",
        );
        setFormState("idle");
      }
    };

    const {
      data: { subscription },
    } = authService.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "PASSWORD_RECOVERY") {
          setFormState("idle");
          setError(null);
        } else if (event === "SIGNED_IN" && session) {
          setFormState("idle");
          setError(null);
        }
      },
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [getErrorFromHash, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      const msg = t("resetPassword.passwordsMismatch");
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = t("resetPassword.passwordTooShort");
      setError(msg);
      toast.error(msg);
      return;
    }

    setFormState("loading");

    try {
      await authService.updatePassword(password);
      setFormState("success");
      toast.success(t("resetPassword.success"));

      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (err) {
      setFormState("idle");
      const errorMsg =
        (err instanceof Error ? err.message : String(err)) ||
        t("resetPassword.error");
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const isLoading = formState === "loading" || formState === "checking";
  const isSuccess = formState === "success";

  // Checking state — show spinner
  if (formState === "checking") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 w-full">
        <Loader2 className="h-8 w-8 animate-spin text-[#3c83f6]" />
        <p className="text-[16px] text-[#64748b]">
          {t("resetPassword.verifying") || "Verifying link..."}
        </p>
      </div>
    );
  }

  // Error state — invalid/expired link
  if (error && formState === "idle" && !isSuccess) {
    return (
      <div className="flex flex-col gap-[32px] w-full">
        <div className="flex flex-col gap-[8px]">
          <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
            {t("resetPassword.title")}
          </h2>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("common.error") || "Error"}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex flex-col gap-[12px]">
          <div className="relative">
            <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
            <button
              onClick={() => router.push(`/${locale}/forgot-password`)}
              className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] text-white text-[16px] font-bold rounded-[8px] transition-colors"
            >
              {t("resetPassword.requestNewLink") || "Request New Reset Link"}
            </button>
          </div>
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="w-full h-[48px] bg-transparent hover:bg-[#f8fafc] text-[#64748b] text-[14px] font-medium rounded-[8px] transition-colors border border-[#e2e8f0]"
          >
            {t("resetPassword.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex flex-col gap-[32px] w-full">
        <div className="flex flex-col gap-[8px]">
          <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
            {t("resetPassword.successTitle") || "Password Updated!"}
          </h2>
          <p className="text-[16px] leading-[24px] text-[#64748b]">
            {t("resetPassword.successDescription")}
          </p>
        </div>
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">
            {t("resetPassword.success")}
          </AlertTitle>
          <AlertDescription>
            {t("resetPassword.successDescription")}
          </AlertDescription>
        </Alert>
        <div className="relative">
          <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] text-white text-[16px] font-bold rounded-[8px] transition-colors"
          >
            {t("resetPassword.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[32px] w-full">
      {/* Header */}
      <div className="flex flex-col gap-[8px]">
        <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
          {t("resetPassword.title")}
        </h2>
        <p className="text-[16px] leading-[24px] text-[#64748b]">
          {t("resetPassword.subtitle")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
        {/* New password */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="password"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("resetPassword.password")}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Lock className="h-[17.5px] w-[13.3px] text-[#94a3b8]" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("resetPassword.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
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
          <p className="text-[12px] leading-[16px] text-[#64748b]">
            {t("resetPassword.passwordHint") || "Must be at least 8 characters"}
          </p>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="confirmPassword"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("resetPassword.confirmPassword")}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Lock className="h-[17.5px] w-[13.3px] text-[#94a3b8]" />
            </div>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("resetPassword.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
              className="h-[48px] pl-[41px] pr-[49px] border-[#e2e8f0] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[16px] placeholder:text-[#94a3b8] focus-visible:ring-[#3c83f6]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-[12.5px] w-[18.3px]" />
              ) : (
                <Eye className="h-[12.5px] w-[18.3px]" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("resetPassword.submit")}
          </button>
        </div>
      </form>

      {/* Back to login */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/login`)}
          className="inline-flex items-center gap-[8px] text-[14px] font-medium text-[#64748b] hover:text-[#0f172a] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("resetPassword.backToLogin")}
        </button>
      </div>
    </div>
  );
}
