"use client";

import { useParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginBranding } from "@/components/auth/LoginBranding";
import Image from "next/image";

export default function LoginPage() {
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
      brandingContent={<LoginBranding />}
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
            {t("login.brandName") || "Ledgerly"}
          </span>
        </div>
      }
      footerLinks={
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
          <a
            href={`/${locale}/about`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("login.about") || "About"}
          </a>
          <a
            href={`/${locale}/contact`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("login.contact") || "Contact"}
          </a>
          <a
            href={`/${locale}/pricing`}
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            {t("login.pricing") || "Pricing"}
          </a>
        </div>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
