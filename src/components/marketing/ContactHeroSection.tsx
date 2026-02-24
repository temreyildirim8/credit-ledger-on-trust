"use client";

import { useTranslations } from "next-intl";

/**
 * Contact Us Hero Section - Matches Figma design
 * "Get in Touch" headline with description
 * https://www.figma.com/design/lScDg7yDwbuPXjK5g7KCfC/Credit_Ledger_v4?node-id=11-1541
 */
export function ContactHeroSection() {
  const t = useTranslations("contact");

  return (
    <section className="relative overflow-hidden bg-white px-5 py-[80px] md:px-20 md:py-[128px]">
      {/* Radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 70% 50%, rgba(60,131,246,0.05) 0%, rgba(60,131,246,0) 50%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center bg-[rgba(60,131,246,0.1)] px-3 py-1 rounded-full">
          <span className="text-[12px] font-bold text-[#3c83f6] uppercase tracking-[0.6px]">
            {t("hero.badge")}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[36px] font-extrabold leading-[1.2] tracking-[-0.025em] text-[#0f172a] md:text-[48px] md:leading-[48px] md:tracking-[-1.2px]">
          {t("hero.title")}
        </h1>

        {/* Description */}
        <p className="max-w-[672px] text-[18px] leading-[28px] text-[#475569]">
          {t("hero.subtitle")}
        </p>
      </div>
    </section>
  );
}
