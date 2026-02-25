"use client";

import { useTranslations } from "next-intl";

/**
 * About Us Story Section - Matches Figma design
 * "Our Story: From Paper to Cloud" with image and content
 */
export function AboutStorySection() {
  const t = useTranslations("about.story");

  return (
    <section className="bg-[#f5f7f8] px-5 py-24 md:px-20">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-16 lg:flex-row">
        {/* Image */}
        <div className="relative h-[400px] w-full flex-1 overflow-hidden rounded-2xl shadow-2xl lg:h-[600px]">
          {/* Placeholder image - gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3c83f6] to-[#1d4ed8]" />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0)]" />

          {/* Quote overlay */}
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-[12px] font-bold uppercase tracking-[1.4px] text-white/80">
              {t("badge")}
            </p>
            <p className="mt-2 text-[18px] font-bold leading-[28px] text-white md:text-[20px]">
              &quot;{t("quote")}&quot;
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h2 className="text-[36px] font-extrabold leading-[1.2] tracking-[-0.025em] text-[#0f172a] md:text-[48px] md:leading-[48px] md:tracking-[-1.2px]">
            {t("title1")}
            <br />
            {t("title2")}
          </h2>

          {/* Blue underline accent */}
          <div className="mt-6 h-[6px] w-20 bg-[#3c83f6]" />

          <p className="mt-6 max-w-[528px] text-[18px] leading-[29px] text-[#475569]">
            {t("paragraph1")}
          </p>

          <p className="mt-6 max-w-[480px] text-[18px] leading-[29px] text-[#475569]">
            {t("paragraph2")}{" "}
            <span className="font-bold">{t("digitalTrust")}</span>. {t("paragraph3")}
          </p>

          {/* Stats */}
          <div className="mt-8 flex gap-8">
            <div>
              <p className="text-[30px] font-extrabold text-[#3c83f6]">{t("stat1Value")}</p>
              <p className="text-[14px] font-semibold text-[#64748b]">
                {t("stat1Label")}
              </p>
            </div>
            <div>
              <p className="text-[30px] font-extrabold text-[#3c83f6]">{t("stat2Value")}</p>
              <p className="text-[14px] font-semibold text-[#64748b]">
                {t("stat2Label")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
