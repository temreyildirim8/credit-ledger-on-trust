"use client";

import { SignupForm } from "@/components/auth/SignupForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupBranding } from "@/components/auth/SignupBranding";
import Image from "next/image";

export default function SignupPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const t = useTranslations("auth");

  // Show loader while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)]"></div>
      </div>
    );
  }

  // Don't render the form if already authenticated (redirect in progress)
  if (user) {
    return null;
  }

  return (
    <AuthLayout
      brandingContent={<SignupBranding />}
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
            {t("signup.brandName") || "Ledgerly"}
          </span>
        </div>
      }
      footerLinks={
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
          <a
            href={`/${locale}/about`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("signup.about") || "About"}
          </a>
          <a
            href={`/${locale}/contact`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("signup.contact") || "Contact"}
          </a>
          <a
            href={`/${locale}/pricing`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("signup.pricing") || "Pricing"}
          </a>
        </div>
      }
    >
      <SignupForm />
    </AuthLayout>
  );
}
