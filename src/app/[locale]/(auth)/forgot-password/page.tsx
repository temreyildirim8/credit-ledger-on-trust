"use client";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordBranding } from "@/components/auth/ForgotPasswordBranding";
import { BookOpen } from "lucide-react";

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const t = useTranslations("auth");

  return (
    <AuthLayout
      brandingContent={<ForgotPasswordBranding />}
      mobileLogo={
        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[var(--color-accent)] rounded-xl flex items-center justify-center overflow-hidden text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-[var(--color-text)]">
            {t("forgotPassword.brandName") || "Ledgerly"}
          </span>
        </div>
      }
      footerLinks={
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
          <a
            href={`/${locale}/about`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("forgotPassword.about") || "About"}
          </a>
          <a
            href={`/${locale}/contact`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("forgotPassword.contact") || "Contact"}
          </a>
          <a
            href={`/${locale}/pricing`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("forgotPassword.pricing") || "Pricing"}
          </a>
        </div>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
