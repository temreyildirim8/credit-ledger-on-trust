"use client";

import { Shield, Wifi, Users } from "lucide-react";

/**
 * About Us Built for Trust Section - Matches Figma design
 * Security features and trust badges
 */
export function AboutTrustSection() {
  const features = [
    {
      icon: Shield,
      title: "Bank-Grade Encryption",
      description:
        "Your data is encrypted with AES-256 standards, ensuring your financial records are for your eyes only.",
    },
    {
      icon: Wifi,
      title: "Offline-First Tech",
      description:
        "Sync seamlessly when connected. Our app works perfectly in areas with spotty internet connectivity.",
    },
    {
      icon: Users,
      title: "Community Driven",
      description:
        "Built in collaboration with local trade associations and artisans across 4 continents.",
    },
  ];

  const partners = [
    "SafeGuard",
    "CloudArmor",
    "VaultPass",
    "NetShield",
  ];

  return (
    <section className="bg-[#f8fafc] px-5 py-24 md:px-20">
      <div className="mx-auto max-w-[1440px]">
        {/* Partner badges */}
        <div className="mb-12 text-center">
          <p className="text-[14px] font-bold uppercase tracking-[2.8px] text-[#94a3b8]">
            Secured by industry leaders
          </p>
        </div>

        <div className="mb-16 flex flex-wrap items-center justify-center gap-8 opacity-50 lg:gap-24">
          {partners.map((partner) => (
            <div key={partner} className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-[#3c83f6]" />
              <span className="text-[20px] font-bold text-[#0f172a]">
                {partner}
              </span>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid gap-12 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(60,131,246,0.1)]">
                <feature.icon className="h-6 w-6 text-[#3c83f6]" />
              </div>

              {/* Title */}
              <h3 className="mb-3 text-[20px] font-bold text-[#0f172a]">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="max-w-[341px] text-[16px] leading-[24px] text-[#64748b]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
