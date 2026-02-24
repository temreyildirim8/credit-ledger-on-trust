"use client";

import Image from "next/image";
import { ReactNode } from "react";

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
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Visual/Branding (hidden on mobile) */}
      {/* In RTL: this appears on the right, in LTR: on the left */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden rtl:lg:order-last">
        {/* Background Image */}
        <Image
          src="/images/auth-background.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.9)] via-[rgba(15,23,42,0.4)] to-[rgba(15,23,42,0)]" />

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
