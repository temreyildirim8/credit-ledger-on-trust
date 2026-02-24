"use client";

import { useTranslations } from "next-intl";

const offices = [
  {
    country: "Turkey",
    flag: "🇹🇷",
    city: "Istanbul",
    address: "Levent, Büyükdere Cd. No:199 Şişli",
  },
  {
    country: "India",
    flag: "🇮🇳",
    city: "Mumbai",
    address: "Bandra Kurla Complex, Bandra East",
  },
  {
    country: "Indonesia",
    flag: "🇮🇩",
    city: "Jakarta",
    address: "Jl. Jend. Sudirman Kav. 52-53",
  },
  {
    country: "Nigeria",
    flag: "🇳🇬",
    city: "Lagos",
    address: "Victoria Island, Lagos",
  },
];

/**
 * Contact Global Presence Section - Matches Figma design
 * Global office locations grid
 */
export function ContactGlobalSection() {
  const t = useTranslations("contact");

  return (
    <section className="bg-white px-5 py-16 md:px-20 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        {/* Section Header */}
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <h2 className="text-[36px] font-extrabold leading-[1.2] tracking-[-0.025em] text-[#0f172a] md:text-[40px]">
            {t("global.title")}
          </h2>
          <p className="max-w-[672px] text-[18px] leading-[28px] text-[#475569]">
            {t("global.subtitle")}
          </p>
        </div>

        {/* Office Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {offices.map((office) => (
            <div
              key={office.country}
              className="rounded-xl border border-[#f1f5f9] bg-white p-6 transition-shadow hover:shadow-md"
            >
              {/* Flag */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#f8fafc] text-[24px]">
                {office.flag}
              </div>
              {/* Country */}
              <h3 className="mb-2 text-[20px] font-bold text-[#0f172a]">
                {office.country}
              </h3>
              {/* City */}
              <p className="mb-1 text-[14px] font-medium text-[#3c83f6]">
                {office.city}
              </p>
              {/* Address */}
              <p className="text-[14px] leading-[20px] text-[#64748b]">
                {office.address}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
