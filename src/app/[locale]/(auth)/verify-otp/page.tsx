"use client";

import { VerifyOTPForm } from "@/components/auth/VerifyOTPForm";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { VerifyOtpBranding } from "@/components/auth/VerifyOtpBranding";
import Image from "next/image";

export default function VerifyOTPPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const t = useTranslations("auth");

  return (
    <AuthLayout
      brandingContent={<VerifyOtpBranding />}
      mobileLogo={
        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[var(--color-accent)] rounded-xl flex items-center justify-center overflow-hidden">
            <Image
              src="/images/icons/icon-logo.svg"
              alt=""
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </div>
          <span className="text-xl font-bold text-[var(--color-text)]">
            {t("verifyOTP.brandName") || "Ledgerly"}
          </span>
        </div>
      }
      footerLinks={
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
          <a
            href={`/${locale}/about`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("verifyOTP.about") || "About"}
          </a>
          <a
            href={`/${locale}/contact`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("verifyOTP.contact") || "Contact"}
          </a>
          <a
            href={`/${locale}/pricing`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("verifyOTP.pricing") || "Pricing"}
          </a>
        </div>
      }
    >
      <VerifyOTPForm />
    </AuthLayout>
  );
}
