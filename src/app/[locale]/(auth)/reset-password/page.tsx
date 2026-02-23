"use client";

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { BookOpen, Lock, Shield, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const t = useTranslations("auth");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Visual/Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          {/* Logo/Brand */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                {t("resetPassword.brandName") || "Global Ledger"}
              </span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              {t("resetPassword.heroTitle") || "Create new password"}
            </h1>
            <p className="text-lg xl:text-xl text-white/80 max-w-md">
              {t("resetPassword.heroSubtitle") || "Choose a strong password to secure your account."}
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t("resetPassword.feature1Title") || "Strong Password"}</h3>
                <p className="text-white/70 text-sm">{t("resetPassword.feature1Desc") || "Mix of letters, numbers & symbols"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t("resetPassword.feature2Title") || "Encrypted Storage"}</h3>
                <p className="text-white/70 text-sm">{t("resetPassword.feature2Desc") || "Your data stays secure"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t("resetPassword.feature3Title") || "Instant Access"}</h3>
                <p className="text-white/70 text-sm">{t("resetPassword.feature3Desc") || "Log in right after reset"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-10 -left-10 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Right Panel - Reset Password Form */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[var(--color-bg)]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[var(--color-accent)] rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">
              {t("resetPassword.brandName") || "Global Ledger"}
            </span>
          </div>

          <ResetPasswordForm />

          {/* Footer links */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
            <a href={`/${locale}/about`} className="hover:text-[var(--color-accent)] transition-colors">
              {t("resetPassword.about") || "About"}
            </a>
            <a href={`/${locale}/contact`} className="hover:text-[var(--color-accent)] transition-colors">
              {t("resetPassword.contact") || "Contact"}
            </a>
            <a href={`/${locale}/pricing`} className="hover:text-[var(--color-accent)] transition-colors">
              {t("resetPassword.pricing") || "Pricing"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
