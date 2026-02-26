"use client";

import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";

/**
 * Forgot password page branding content for left panel
 * Figma: node 2008-1281 — logo top, headline middle, social proof bottom
 */
export function ForgotPasswordBranding() {
  const t = useTranslations("auth");

  return (
    <>
      {/* TOP: Logo + status badge */}
      <div className="flex flex-col gap-6">
        {/* Logo row */}
        <div className="flex items-center gap-3">
          {/* Blue square logo */}
          <div className="relative flex items-center justify-center w-[40px] h-[40px] rounded-[8px] bg-[rgba(60,131,246,0.9)] shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.2),0px_4px_6px_-4px_rgba(60,131,246,0.2)] flex-shrink-0 text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-[24px] font-bold tracking-[-0.6px] text-white">
            {t("forgotPassword.brandName") || "Global Ledger"}
          </span>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 self-start backdrop-blur-[6px] bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] px-[13px] py-[5px] rounded-full">
          <div className="w-[8px] h-[8px] rounded-full bg-[#4ade80] flex-shrink-0" />
          <span className="text-[14px] font-medium text-white">
            {t("forgotPassword.statusBadge") || "Secure & Encrypted Recovery"}
          </span>
        </div>
      </div>

      {/* MIDDLE: Headline + description */}
      <div className="flex flex-col gap-6 flex-1 justify-center">
        <h1 className="text-[36px] font-extrabold leading-[45px] tracking-[-0.9px] text-white max-w-[461px]">
          {t("forgotPassword.heroTitle") || "Reset Your Password Securely"}
        </h1>
        <p className="text-[18px] font-medium leading-[29px] text-[#e2e8f0] max-w-[528px]">
          {t("forgotPassword.heroSubtitle") ||
            "We'll send a secure verification code to your email. Your account data remains protected throughout the process."}
        </p>
      </div>

      {/* BOTTOM: Social proof — avatar stack + joined text */}
      <div className="flex flex-col gap-0">
        {/* Horizontal border */}
        <div className="w-full border-t border-[rgba(255,255,255,0.1)] mb-[25px]" />
        <div className="flex items-center gap-4">
          {/* Avatar stack */}
          <div className="flex items-center">
            <div className="relative w-[40px] h-[40px] rounded-full bg-[#1e293b] border-2 border-[#0f172a] overflow-hidden flex-shrink-0 z-30">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6] to-[#1e40af]" />
            </div>
            <div className="relative w-[40px] h-[40px] rounded-full bg-[#1e293b] border-2 border-[#0f172a] overflow-hidden flex-shrink-0 -ml-[8px] z-20">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]" />
            </div>
            <div className="relative w-[40px] h-[40px] rounded-full bg-[#1e293b] border-2 border-[#0f172a] overflow-hidden flex-shrink-0 -ml-[8px] z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#10b981] to-[#059669]" />
            </div>
          </div>
          {/* Text */}
          <div>
            <span className="text-[14px] font-bold text-white">5,000+</span>
            <span className="text-[14px] font-normal text-[#cbd5e1]">
              {" "}
              new shops joined this week
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
