"use client";

import { SignupForm } from '@/components/auth/SignupForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { BookOpen, Users, TrendingUp, Shield, Globe, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Start Panel - Visual/Branding (hidden on mobile) */}
      {/* In RTL: this appears on the right, in LTR: on the left */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] relative overflow-hidden rtl:lg:order-last">
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
                {t("signup.brandName") || "Ledgerly"}
              </span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              {t("signup.heroTitle") || "Start tracking credit today"}
            </h1>
            <p className="text-lg xl:text-xl text-white/80 max-w-md">
              {t("signup.heroSubtitle") || "Free forever for small businesses. Upgrade as you grow."}
            </p>
          </div>

          {/* Benefits list */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 rtl:flex-row-reverse">
              <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white/90 rtl:text-end">{t("signup.benefit1") || "Free plan: Up to 10 customers"}</span>
            </div>
            <div className="flex items-center gap-3 rtl:flex-row-reverse">
              <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white/90 rtl:text-end">{t("signup.benefit2") || "Works offline with automatic sync"}</span>
            </div>
            <div className="flex items-center gap-3 rtl:flex-row-reverse">
              <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white/90 rtl:text-end">{t("signup.benefit3") || "Multi-currency support"}</span>
            </div>
            <div className="flex items-center gap-3 rtl:flex-row-reverse">
              <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white/90 rtl:text-end">{t("signup.benefit4") || "PDF statements & CSV exports"}</span>
            </div>
            <div className="flex items-center gap-3 rtl:flex-row-reverse">
              <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white/90 rtl:text-end">{t("signup.benefit5") || "Available in 7 languages"}</span>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">{t("signup.feature1Title") || "Customer Ledger"}</h3>
                <p className="text-white/60 text-xs">{t("signup.feature1Desc") || "Track all debts"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">{t("signup.feature2Title") || "Reports"}</h3>
                <p className="text-white/60 text-xs">{t("signup.feature2Desc") || "Analytics & insights"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">{t("signup.feature3Title") || "Secure"}</h3>
                <p className="text-white/60 text-xs">{t("signup.feature3Desc") || "Bank-level security"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">{t("signup.feature4Title") || "PWA"}</h3>
                <p className="text-white/60 text-xs">{t("signup.feature4Desc") || "Install as app"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements - RTL-aware positioning */}
        <div className="absolute -bottom-20 end-[-5rem] w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -top-10 start-[-2.5rem] w-60 h-60 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[var(--color-bg)]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[var(--color-accent)] rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">
              {t("signup.brandName") || "Ledgerly"}
            </span>
          </div>

          <SignupForm />

          {/* Footer links */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
            <a href={`/${locale}/about`} className="hover:text-[var(--color-accent)] transition-colors">
              {t("signup.about") || "About"}
            </a>
            <a href={`/${locale}/contact`} className="hover:text-[var(--color-accent)] transition-colors">
              {t("signup.contact") || "Contact"}
            </a>
            <a href={`/${locale}/pricing`} className="hover:text-[var(--color-accent)] transition-colors">
              {t("signup.pricing") || "Pricing"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}