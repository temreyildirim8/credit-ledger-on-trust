"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, Users, TrendingUp, Shield, Globe, BookOpen } from "lucide-react";

/**
 * Signup page branding content for left panel
 * Used in AuthLayout component
 */
export function SignupBranding() {
  const t = useTranslations("auth");

  return (
    <>
      {/* Logo/Brand */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            {t("signup.brandName") || "Ledgerly"}
          </span>
        </div>
        <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 text-white">
          {t("signup.heroTitle") || "Start tracking credit today"}
        </h1>
        <p className="text-lg xl:text-xl text-white/80 max-w-md">
          {t("signup.heroSubtitle") ||
            "Free forever for small businesses. Upgrade as you grow."}
        </p>
      </div>

      {/* Benefits list */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-3 rtl:flex-row-reverse">
          <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white/90 rtl:text-end">
            {t("signup.benefit1") || "Free plan: Up to 10 customers"}
          </span>
        </div>
        <div className="flex items-center gap-3 rtl:flex-row-reverse">
          <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white/90 rtl:text-end">
            {t("signup.benefit2") || "Works offline with automatic sync"}
          </span>
        </div>
        <div className="flex items-center gap-3 rtl:flex-row-reverse">
          <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white/90 rtl:text-end">
            {t("signup.benefit3") || "Multi-currency support"}
          </span>
        </div>
        <div className="flex items-center gap-3 rtl:flex-row-reverse">
          <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white/90 rtl:text-end">
            {t("signup.benefit4") || "PDF statements & CSV exports"}
          </span>
        </div>
        <div className="flex items-center gap-3 rtl:flex-row-reverse">
          <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-white/90 rtl:text-end">
            {t("signup.benefit5") || "Available in 7 languages"}
          </span>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white">
              {t("signup.feature1Title") || "Customer Ledger"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("signup.feature1Desc") || "Track all debts"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white">
              {t("signup.feature2Title") || "Reports"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("signup.feature2Desc") || "Analytics & insights"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white">
              {t("signup.feature3Title") || "Secure"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("signup.feature3Desc") || "Bank-level security"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rtl:flex-row-reverse">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-white">
              {t("signup.feature4Title") || "PWA"}
            </h3>
            <p className="text-white/60 text-xs">
              {t("signup.feature4Desc") || "Install as app"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
