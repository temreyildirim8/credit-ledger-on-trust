"use client";

import { useTranslations } from "next-intl";
import { Shield, Smartphone, Lock, Zap } from "lucide-react";
import Image from "next/image";

/**
 * Verify OTP page branding content for left panel
 * Used in AuthLayout component
 */
export function VerifyOtpBranding() {
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
            {t("verifyOtp.brandName") || "Ledgerly"}
          </span>
        </div>
        <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 text-white">
          {t("verifyOtp.heroTitle") || "Verify your identity"}
        </h1>
        <p className="text-lg xl:text-xl text-white/80 max-w-md">
          {t("verifyOtp.heroSubtitle") ||
            "Enter the code sent to your email to complete verification."}
        </p>
      </div>

      {/* OTP Info */}
      <div className="bg-white/10 rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Smartphone className="w-5 h-5 text-white" />
          <span className="text-white/90 text-sm font-medium">
            {t("verifyOtp.checkDevice") || "Check your email for the code"}
          </span>
        </div>
        <p className="text-white/60 text-xs">
          {t("verifyOtp.codeExpiry") || "Code expires in 10 minutes"}
        </p>
      </div>

      {/* Security features */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white text-sm">
              {t("verifyOtp.feature1Title") || "One-time code"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("verifyOtp.feature1Desc") || "Valid for single use only"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white text-sm">
              {t("verifyOtp.feature2Title") || "Encrypted"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("verifyOtp.feature2Desc") || "Sent securely to your email"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white text-sm">
              {t("verifyOtp.feature3Title") || "Quick verification"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("verifyOtp.feature3Desc") || "Usually within seconds"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
