"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  MailCheck,
  ArrowLeft,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.forgotPassword");
  const [isPending, startTransition] = useTransition();

  const emailFromUrl = searchParams.get("email") || "";
  const [email] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const locale =
    typeof window !== "undefined"
      ? window.location.pathname.split("/")[1] || "en"
      : "en";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 8) {
      const msg = t("otpVerification.invalidOtp");
      setError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = t("otpVerification.passwordsMismatch");
      setError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword.length < 6) {
      const msg = t("otpVerification.passwordTooShort");
      setError(msg);
      toast.error(msg);
      return;
    }

    // Dynamic import to avoid circular dependencies
    const { resetPasswordWithOTP } =
      await import("@/app/[locale]/(auth)/forgot-password/actions");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("otp", otp);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    startTransition(async () => {
      const result = await resetPasswordWithOTP(formData);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setSuccess(true);
        toast.success(result.message || t("passwordReset.success"));

        setTimeout(() => {
          router.push(`/${locale}/reset-success`);
        }, 1500);
      }
    });
  };

  const handleResend = async () => {
    const { sendPasswordResetOTP } =
      await import("@/app/[locale]/(auth)/forgot-password/actions");

    const formData = new FormData();
    formData.append("email", email);
    startTransition(async () => {
      const result = await sendPasswordResetOTP(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || t("otpVerification.resendSuccess"));
      }
    });
  };

  // Success state
  if (success) {
    return (
      <div className="flex flex-col gap-[32px] w-full">
        <div className="flex flex-col gap-[8px]">
          <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
            {t("passwordReset.title")}
          </h2>
        </div>
        <Alert>
          <MailCheck className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            {t("passwordReset.successDescription")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[32px] w-full">
      {/* Header */}
      <div className="flex flex-col gap-[8px]">
        <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
          {t("otpVerification.title")}
        </h2>
        <p className="text-[16px] leading-[24px] text-[#64748b]">
          {t("otpVerification.subtitle")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OTP field */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="otp"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("otpVerification.otp")}
          </Label>
          <Input
            id="otp"
            type="text"
            placeholder={t("otpVerification.otpPlaceholder")}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
            }
            required
            maxLength={8}
            disabled={isPending}
            autoFocus
            className="h-[48px] px-[17px] border-[#e2e8f0] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[20px] tracking-[0.3em] text-center placeholder:text-[#94a3b8] placeholder:tracking-normal placeholder:text-[16px] focus-visible:ring-[#3c83f6]"
          />
          <p className="text-[12px] leading-[16px] text-[#64748b]">
            {t("otpVerification.otpHint")}
          </p>
        </div>

        {/* New password */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="newPassword"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("otpVerification.newPassword")}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Lock className="h-[17.5px] w-[13.3px] text-[#94a3b8]" />
            </div>
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder={t("otpVerification.newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={isPending}
              className="h-[48px] pl-[41px] pr-[49px] border-[#e2e8f0] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[16px] placeholder:text-[#94a3b8] focus-visible:ring-[#3c83f6]"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
              tabIndex={-1}
            >
              {showNewPassword ? (
                <EyeOff className="h-[12.5px] w-[18.3px]" />
              ) : (
                <Eye className="h-[12.5px] w-[18.3px]" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="confirmPassword"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("otpVerification.confirmPassword")}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Lock className="h-[17.5px] w-[13.3px] text-[#94a3b8]" />
            </div>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("otpVerification.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={isPending}
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

        {/* Submit */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
          <button
            type="submit"
            disabled={isPending}
            className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("otpVerification.submit")}
          </button>
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/forgot-password`)}
          disabled={isPending}
          className="inline-flex items-center gap-[8px] text-[14px] font-medium text-[#64748b] hover:text-[#0f172a] transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("otpVerification.back")}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={isPending}
          className="text-[14px] font-medium text-[#3c83f6] hover:underline disabled:opacity-50"
        >
          {t("otpVerification.resend")}
        </button>
      </div>
    </div>
  );
}
