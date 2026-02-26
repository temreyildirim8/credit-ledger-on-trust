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
 * Figma: node 2008-1281
 * Left panel: full-bleed background image, dark navy gradient overlay, p-[48px], justify-between
 * Right panel: pure white bg, px-[24px] py-[48px], max-w-[440px] content
 */
export function AuthLayout({
  children,
  brandingContent,
  mobileLogo,
  footerLinks,
}: AuthLayoutProps) {
  const t = useTranslations("nav");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Top navigation - only visible on mobile */}
      <div className="flex lg:hidden absolute top-4 start-4 end-4 z-50 items-center justify-end">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg w-fit"
          >
            <Home className="h-4 w-4 " />
            <span className="hidden sm:inline">{t("home")}</span>
          </Link>
          <div className="w-fit">
            <LanguageSwitcher variant="icon" />
          </div>
        </div>
      </div>

      {/* Left Panel - Visual/Branding (hidden on mobile) */}
      {/* In RTL: this appears on the right, in LTR: on the left */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden rtl:lg:order-last">
        {/* Background Image - full bleed */}
        <Image
          src="/images/auth-background.webp"
          alt=""
          fill
          sizes="55vw"
          className="object-cover"
          priority
        />

        {/* Dark navy gradient overlay — from-[rgba(15,23,42,0.9)] via-[rgba(15,23,42,0.5)] to-[rgba(15,23,42,0.2)] */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.9)] via-[rgba(15,23,42,0.5)] to-[rgba(15,23,42,0.2)]" />

        {/* Branding Content — justify-between to pin logo at top and social proof at bottom */}
        <div className="relative z-10 flex flex-col justify-between w-full p-[48px]">
          {/* Top nav row: language switcher pinned top-right */}
          <div className="flex items-center justify-end mb-auto">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                <Home className="h-4 w-4" />
              </Link>
              <LanguageSwitcher variant="icon" />
            </div>
          </div>

          {/* Branding content fills middle/bottom */}
          <div className="flex-1 flex flex-col justify-between mt-8">
            {brandingContent}
          </div>
        </div>
      </div>

      {/* Right Panel - Form — pure white, centered content */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex items-center justify-center px-[24px] py-[48px] bg-white min-h-screen">
        <div className="w-full max-w-[440px]">
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
