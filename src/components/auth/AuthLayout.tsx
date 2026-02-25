"use client";

import Image from "next/image";
import { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Link } from "@/routing";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";

type AuthLayoutProps = {
  children: ReactNode;
  brandingContent: ReactNode;
  mobileLogo?: ReactNode;
  footerLinks?: ReactNode;
};

/**
 * Shared layout component for authentication pages
 * Features background image from Figma design with gradient overlay
 */
export function AuthLayout({
  children,
  brandingContent,
  mobileLogo,
  footerLinks,
}: AuthLayoutProps) {
  const t = useTranslations('nav');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Top navigation - Home link and Language Switcher */}
      <div className="absolute top-4 start-4 end-4 z-50 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">{t('home')}</span>
        </Link>
        <LanguageSwitcher />
      </div>
      {/* Left Panel - Visual/Branding (hidden on mobile) */}
      {/* In RTL: this appears on the right, in LTR: on the left */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden rtl:lg:order-last">
        {/* Background Image */}
        <Image
          src="/images/auth-background.webp"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />

        {/* Blue gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#3B82F6]/90 via-[#3B82F6]/60 to-[#3B82F6]/30" />

        {/* Branding Content - Logo, title, features */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          {brandingContent}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[var(--color-bg)]">
        <div className="w-full max-w-md">
          {/* Mobile Logo - only visible on mobile */}
          {mobileLogo}

          {/* Form Content */}
          {children}

          {/* Footer Links */}
          {footerLinks}
        </div>
      </div>
    </div>
  );
}
