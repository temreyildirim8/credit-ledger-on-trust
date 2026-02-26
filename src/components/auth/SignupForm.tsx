"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Image from "next/image";
import { Link } from "@/routing";

type FormState = "idle" | "loading" | "success";

export function SignupForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const { signUp, user, session } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] =
    useState(false);

  // Extract locale from pathname
  const segments = pathname.split("/");
  const locale = segments[1] || "en";

  // Redirect to onboarding when user becomes authenticated (auto-confirmed signup)
  useEffect(() => {
    if (
      user &&
      session &&
      formState === "success" &&
      !requiresEmailConfirmation
    ) {
      router.replace(`/${locale}/onboarding`);
    }
  }, [user, session, formState, requiresEmailConfirmation, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formState === "loading") return;

    if (!termsAccepted) {
      toast.error(
        t("signup.acceptTerms") ||
          "Please accept the Terms of Service and Privacy Policy",
      );
      return;
    }

    setFormState("loading");

    try {
      const result = await signUp(email, password, name.trim());

      const needsConfirmation = !result?.session;
      setRequiresEmailConfirmation(needsConfirmation);
      setFormState("success");

      if (needsConfirmation) {
        toast.success(t("signup.success") || "Account created successfully");
      } else {
        toast.success(
          t("signup.successAutoConfirmed") || "Account created! Redirecting...",
        );
      }
    } catch (error) {
      setFormState("idle");
      toast.error(
        (error instanceof Error ? error.message : String(error)) ||
          t("signup.error") ||
          "Failed to create account",
      );
    }
  };

  const isLoading = formState === "loading";
  const isSuccess = formState === "success";

  // Success state: email confirmation required
  if (isSuccess && requiresEmailConfirmation) {
    return (
      <div className="flex flex-col gap-[32px] w-full">
        <div className="flex flex-col gap-[8px]">
          <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
            {t("signup.emailSentTitle") || "Check Your Email"}
          </h2>
          <p className="text-[16px] leading-[24px] text-[#64748b]">
            {t("signup.emailSentSubtitle") ||
              "A verification link has been sent to your inbox."}
          </p>
        </div>
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">
            {t("signup.successTitle") || "Registration Successful!"}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {t("signup.successDescription1") ||
                "We have sent a verification link to your email address."}
            </p>
            <p className="text-sm">
              {t("signup.successDescription2") ||
                "Please check your inbox (and spam folder), then click the link to verify your account."}
            </p>
          </AlertDescription>
        </Alert>
        <div className="relative">
          <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] text-white text-[16px] font-bold rounded-[8px] transition-colors"
          >
            {t("signup.goToLogin") || "Go to Login Page"}
          </button>
        </div>
      </div>
    );
  }

  // Auto-confirmed — show loader overlay while redirecting
  if (isSuccess && !requiresEmailConfirmation) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#3c83f6]" />
          <p className="text-[16px] font-medium text-[#475569]">
            {t("signup.redirecting") || "Setting up your account..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[32px] w-full">
      {/* Header */}
      <div className="flex flex-col gap-[8px]">
        <h2 className="text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-[#0f172a]">
          {t("signup.title")}
        </h2>
        <p className="text-[16px] leading-[24px] text-[#64748b]">
          {t("signup.subtitle")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
        {/* Business Name field */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="name"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("signup.name")}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Briefcase className="h-[15px] w-[16.7px] text-[#94a3b8]" />
            </div>
            <Input
              id="name"
              type="text"
              placeholder={t("signup.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="h-[48px] pl-[41px] pr-[17px] border-[#e2e8f0] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[16px] placeholder:text-[#94a3b8] focus-visible:ring-[#3c83f6]"
            />
          </div>
        </div>

        {/* Email field */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="email"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("signup.email")}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Mail className="h-[13.3px] w-[16.7px] text-[#94a3b8]" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder={t("signup.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-[48px] pl-[41px] pr-[17px] border-[#e2e8f0] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] text-[16px] placeholder:text-[#94a3b8] focus-visible:ring-[#3c83f6]"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-[6px]">
          <Label
            htmlFor="password"
            className="text-[14px] font-semibold text-[#334155]"
          >
            {t("signup.password")}
          </Label>
          <div className="relative">
            <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
              <Lock className="h-[17.5px] w-[13.3px] text-[#94a3b8]" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("signup.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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
            {t("signup.passwordHint") || "Must be at least 8 characters"}
          </p>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-[12px] pt-[4px]">
          <div className="flex items-center h-[24px]">
            <input
              id="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={isLoading}
              className="w-[16px] h-[16px] rounded-[4px] border border-[#cbd5e1] accent-[#3c83f6] cursor-pointer"
            />
          </div>
          <label
            htmlFor="terms"
            className="text-[14px] font-medium text-[#475569] leading-[24px] cursor-pointer"
          >
            {t("signup.agreePrefix") || "I agree to the "}{" "}
            <Link
              href="/legal/terms"
              className="text-[#3c83f6] hover:underline font-medium"
              target="_blank"
            >
              {t("signup.termsLink") || "Terms of Service"}
            </Link>{" "}
            {t("signup.agreeAnd") || "and"}{" "}
            <Link
              href="/legal/privacy"
              className="text-[#3c83f6] hover:underline font-medium"
              target="_blank"
            >
              {t("signup.privacyLink") || "Privacy Policy"}
            </Link>
            .
          </label>
        </div>

        {/* Submit button */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]" />
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full h-[48px] bg-[#3c83f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("signup.submit")}
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
        <GoogleSignInButton redirectTo={`/${locale}/onboarding`} />
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
          {t("signup.hasAccount")}{" "}
          <a
            href={`/${locale}/login`}
            className="font-bold text-[#3c83f6] hover:underline"
          >
            {t("signup.signIn")}
          </a>
        </p>
      </div>
    </div>
  );
}
