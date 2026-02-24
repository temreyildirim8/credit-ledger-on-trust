"use client";

import { useTranslations } from "next-intl";
import { KeyRound, Shield, Lock } from "lucide-react";
import Image from "next/image";

/**
 * Forgot password page branding content for left panel
 * Used in AuthLayout component
 */
export function ForgotPasswordBranding() {
  const t = useTranslations("auth");

  return (
    <>
      {/* Logo/Brand */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center overflow-hidden">
            <Image
              src="/images/icons/icon-logo.svg"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7"
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            {t("forgotPassword.brandName") || "Ledgerly"}
          </span>
        </div>
        <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 text-white">
          {t("forgotPassword.heroTitle") || "Forgot your password?"}
        </h1>
        <p className="text-lg xl:text-xl text-white/80 max-w-md">
          {t("forgotPassword.heroSubtitle") ||
            "No worries, we'll help you reset it securely."}
        </p>
      </div>

      {/* Feature highlights */}
      <div className="space-y-5">
        <div className="flex items-start gap-4 rtl:flex-row-reverse">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-lg text-white">
              {t("forgotPassword.feature1Title") || "Secure Reset"}
            </h3>
            <p className="text-white/70 text-sm">
              {t("forgotPassword.feature1Desc") || "OTP sent to your email"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rtl:flex-row-reverse">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-lg text-white">
              {t("forgotPassword.feature2Title") || "Encrypted"}
            </h3>
            <p className="text-white/70 text-sm">
              {t("forgotPassword.feature2Desc") || "Bank-grade security"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rtl:flex-row-reverse">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-lg text-white">
              {t("forgotPassword.feature3Title") || "Quick Recovery"}
            </h3>
            <p className="text-white/70 text-sm">
              {t("forgotPassword.feature3Desc") || "Back to business in minutes"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
