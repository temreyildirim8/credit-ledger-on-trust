"use client";

import { useTranslations } from "next-intl";
import { KeyRound, Shield, Lock, CheckCircle } from "lucide-react";
import Image from "next/image";

/**
 * Reset password page branding content for left panel
 * Used in AuthLayout component
 */
export function ResetPasswordBranding() {
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
            {t("resetPassword.brandName") || "Ledgerly"}
          </span>
        </div>
        <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 text-white">
          {t("resetPassword.heroTitle") || "Create new password"}
        </h1>
        <p className="text-lg xl:text-xl text-white/80 max-w-md">
          {t("resetPassword.heroSubtitle") ||
            "Your new password must be secure and memorable."}
        </p>
      </div>

      {/* Security tips */}
      <div className="space-y-4 mb-8">
        <p className="text-white/60 text-sm font-medium">
          {t("resetPassword.tipsTitle") || "Password requirements:"}
        </p>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-white/50" />
          <span className="text-white/70 text-sm">
            {t("resetPassword.tip1") || "At least 8 characters"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-white/50" />
          <span className="text-white/70 text-sm">
            {t("resetPassword.tip2") || "One uppercase letter"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-white/50" />
          <span className="text-white/70 text-sm">
            {t("resetPassword.tip3") || "One number"}
          </span>
        </div>
      </div>

      {/* Security features */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white">
              {t("resetPassword.feature1Title") || "Encrypted Storage"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("resetPassword.feature1Desc") || "Passwords are hashed"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white">
              {t("resetPassword.feature2Title") || "Secure Connection"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("resetPassword.feature2Desc") || "HTTPS encrypted"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white">
              {t("resetPassword.feature3Title") || "Auto-lockout"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("resetPassword.feature3Desc") || "After 5 failed attempts"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
