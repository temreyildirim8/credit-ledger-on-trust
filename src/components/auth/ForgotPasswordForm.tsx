"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MailCheck, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { sendPasswordResetOTP } from "@/app/[locale]/(auth)/forgot-password/actions";

export function ForgotPasswordForm() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("auth.forgotPassword");
  const [isPending, startTransition] = useTransition();

  // Extract locale from pathname
  const segments = pathname.split("/");
  const locale = segments[1] || "en";

  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("email", email);

    startTransition(async () => {
      const result = await sendPasswordResetOTP(formData);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setIsSuccess(true);
        toast.success(result.message || t("success"));
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-[32px] w-full">
        {/* Header */}
        <div className="flex flex-col gap-[8px]">
          <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
            {t("emailSent.title") || "Check Your Email"}
          </h2>
          <p className="text-[16px] leading-[24px] text-[#64748b]">
            {t("emailSent.subtitle") ||
              "We've sent a password reset link to your email address."}
          </p>
        </div>

        <Alert>
          <MailCheck className="h-4 w-4 text-green-600" />
          <AlertDescription>
            {t("emailSent.description") ||
              `If an account exists for ${email}, you will receive a password reset link shortly.`}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-[12px]">
          <div className="relative">
            <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] text-white text-[16px] font-bold rounded-[8px] transition-colors"
            >
              {t("backToLogin") || "Back to Login"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSuccess(false);
              setEmail("");
            }}
            className="w-full h-[48px] bg-transparent hover:bg-[#f8fafc] text-[#64748b] text-[14px] font-medium rounded-[8px] transition-colors border border-[#e2e8f0]"
          >
            {t("tryAnotherEmail") || "Try another email"}
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
          {t("title") || "Forgot Password"}
        </h2>
        <p className="text-[16px] leading-[24px] text-[#64748b]">
          {t("subtitle") ||
            "Enter your email address and we'll send you a link to reset your password."}
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

        {/* Email field */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="email"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("email") || "Email"}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Mail className="h-[13.3px] w-[16.7px] text-[#94a3b8]" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder") || "Enter your email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              autoFocus
              className="h-[48px] pl-[41px] pr-[17px] border-[#e2e8f0] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[16px] placeholder:text-[#94a3b8] focus-visible:ring-[#3c83f6]"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
          <button
            type="submit"
            disabled={isPending}
            className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("submit") || "Send Reset Link"}
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
          {t("backToLogin") || "Back to Login"}
        </button>
      </div>
    </div>
  );
}
