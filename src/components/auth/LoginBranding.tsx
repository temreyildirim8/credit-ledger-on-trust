"use client";

import { useTranslations } from "next-intl";
import { Users, TrendingUp, Shield, Globe, BookOpen } from "lucide-react";

/**
 * Login page branding content for left panel
 * Used in AuthLayout component
 */
export function LoginBranding() {
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
            {t("login.brandName") || "Ledgerly"}
          </span>
        </div>
        <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 text-white">
          {t("login.heroTitle") || "Track credit. Build trust."}
        </h1>
        <p className="text-lg xl:text-xl text-white/80 max-w-md">
          {t("login.heroSubtitle") ||
            "The simple way to manage customer credit for your small business."}
        </p>
      </div>

      {/* Feature highlights */}
      <div className="space-y-5">
        <div className="flex items-start gap-4 rtl:flex-row-reverse">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-lg text-white">
              {t("login.feature1Title") || "Customer Directory"}
            </h3>
            <p className="text-white/70 text-sm">
              {t("login.feature1Desc") || "Keep track of who owes what"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rtl:flex-row-reverse">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-lg text-white">
              {t("login.feature2Title") || "Smart Reports"}
            </h3>
            <p className="text-white/70 text-sm">
              {t("login.feature2Desc") || "Insights into your receivables"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rtl:flex-row-reverse">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-lg text-white">
              {t("login.feature3Title") || "Secure & Offline"}
            </h3>
            <p className="text-white/70 text-sm">
              {t("login.feature3Desc") || "Works without internet"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rtl:flex-row-reverse">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="rtl:text-end">
            <h3 className="font-semibold text-lg text-white">
              {t("login.feature4Title") || "Multi-Currency"}
            </h3>
            <p className="text-white/70 text-sm">
              {t("login.feature4Desc") || "TRY, IDR, NGN, EGP, ZAR & more"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
