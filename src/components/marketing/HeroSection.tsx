"use client";

import { Link } from "@/routing";
import { Play, Download, Shield, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Hero section - Matches Figma design
 * Light background, large headline, CTAs, hero image
 */
export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden bg-[#f5f7f8] px-5 py-16 md:py-24 lg:py-[128px] md:px-20">
      <div className="relative max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-[54px] items-center justify-center">
          {/* Content */}
          <div className="flex-1 max-w-[584px] w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[rgba(60,131,246,0.1)] border border-[rgba(60,131,246,0.2)] px-4 py-2 md:px-[17px] md:py-[9px] rounded-full mb-8 md:mb-[70px]">
              <CheckCircle className="h-3 w-3 text-[#3c83f6]" />
              <span className="text-[10px] md:text-[12px] font-bold text-[#3c83f6] uppercase tracking-[0.6px]">
                {t("badge")}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-black leading-tight lg:leading-[72px] tracking-[-0.025em] lg:tracking-[-1.8px] text-[#0f172a] mb-6 md:mb-8">
              {t("title1")}
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>{t("title2")}
              <br />
              <span className="text-[#3c83f6]">{t("title3")}</span>
            </h1>

            {/* Description */}
            <p className="text-base md:text-[18px] leading-relaxed md:leading-[29px] text-[#475569] max-w-[576px] mb-8 md:mb-12">
              {t("description")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 md:gap-3 bg-[#3c83f6] text-white px-8 md:px-10 py-4 md:py-[22px] rounded-full text-base md:text-[18px] font-bold transition-all duration-200 shadow-[0px_20px_25px_-5px_rgba(60,131,246,0.3),0px_8px_10px_-6px_rgba(60,131,246,0.3)] hover:bg-[#3b82f6]"
              >
                <Download className="h-5 w-5" />
                {t("cta")}
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 md:gap-3 bg-white border-2 border-[#f1f5f9] text-[#0f172a] px-8 md:px-[42px] py-4 md:py-[22px] rounded-full text-base md:text-[18px] font-bold transition-all duration-200 hover:border-[#e2e8f0]"
              >
                <Play className="h-5 w-5" />
                {t("secondary")}
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative flex-1 max-w-[594px] w-full hidden lg:block">
            {/* Blue blur decoration */}
            <div className="absolute bg-[rgba(60,131,246,0.2)] blur-[60px] w-[384px] h-[384px] rounded-full -right-20 -top-[70px]" />

            {/* Main image container */}
            <div className="relative rotate-[2deg]">
              <div className="bg-transparent rounded-[48px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden">
                <div className="aspect-square w-full max-w-[584px] bg-gradient-to-br from-[#3c83f6] to-[#1d4ed8] flex items-center justify-center">
                  {/* Placeholder for hero image - shows app mockup */}
                  <div className="text-white text-center p-12">
                    <Shield className="h-24 w-24 mx-auto mb-6 opacity-80" />
                    <p className="text-2xl font-bold mb-2">{t("imageTitle")}</p>
                    <p className="text-white/80">{t("imageSubtitle")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
