"use client";

import {
  UserPlus,
  Receipt,
  Wallet,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Features section - "How it Works" and "Built for Resilience"
 * Matches Figma design with 3-step process and feature list
 */
export function FeaturesSection() {
  const t = useTranslations("features");

  const steps = [
    {
      icon: UserPlus,
      title: t("howItWorks.step1.title"),
      description: t("howItWorks.step1.description"),
    },
    {
      icon: Receipt,
      title: t("howItWorks.step2.title"),
      description: t("howItWorks.step2.description"),
    },
    {
      icon: Wallet,
      title: t("howItWorks.step3.title"),
      description: t("howItWorks.step3.description"),
    },
  ];

  const features = [
    {
      title: t("resilience.feature1.title"),
      description: t("resilience.feature1.description"),
    },
    {
      title: t("resilience.feature2.title"),
      description: t("resilience.feature2.description"),
    },
    {
      title: t("resilience.feature3.title"),
      description: t("resilience.feature3.description"),
    },
  ];

  return (
    <>
      {/* How it Works Section */}
      <section id="features" className="bg-white px-5 py-16 md:py-24 md:px-20">
        <div className="max-w-[1280px] mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-2xl sm:text-3xl md:text-[36px] font-black leading-tight md:leading-[40px] tracking-[-0.025em] md:tracking-[-0.9px] text-[#0f172a] mb-4 md:mb-6">
              {t("howItWorks.title")}
            </h2>
            <p className="text-base md:text-[18px] leading-relaxed md:leading-[28px] text-[#475569] max-w-[672px] mx-auto">
              {t("howItWorks.description")}
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex-1 max-w-[389px] bg-white border border-[#e2e8f0] rounded-3xl md:rounded-[48px] p-6 md:p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-[rgba(60,131,246,0.1)] rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                    <Icon className="h-6 w-6 text-[#3c83f6]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg md:text-[20px] font-bold leading-snug md:leading-[28px] text-[#0f172a] mb-2 md:mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm md:text-[16px] leading-relaxed md:leading-[26px] text-[#475569]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for Resilience Section */}
      <section className="px-5 py-16 md:py-24 md:px-20">
        <div className="max-w-[1280px] mx-auto">
          <div className="bg-[#3c83f6] rounded-3xl md:rounded-[48px] py-12 md:py-24 px-6">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-center">
              {/* Content */}
              <div className="flex-1 max-w-[576px]">
                <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-black leading-tight lg:leading-[48px] text-white mb-6 md:mb-8">
                  {t("resilience.title1")}
                  <br />
                  {t("resilience.title2")}
                </h2>

                {/* Feature List */}
                <div className="space-y-6 md:space-y-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-9 h-7 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg md:text-[20px] font-bold leading-snug md:leading-[28px] text-white mb-1 md:mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-sm md:text-[16px] leading-relaxed md:leading-[24px] text-[#dbeafe] opacity-90">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="flex-1 max-w-[576px] relative w-full hidden lg:block">
                {/* Blur decoration */}
                <div className="absolute bg-[rgba(255,255,255,0.1)] blur-[32px] inset-0 rounded-[48px]" />

                {/* Dashboard card */}
                <div className="relative bg-[#0f172a] border border-[rgba(255,255,255,0.1)] rounded-[48px] p-[17px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
                  <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[32px] aspect-square w-full flex items-center justify-center">
                    <div className="text-white text-center p-12">
                      <TrendingUp className="h-20 w-20 mx-auto mb-6 text-[#3c83f6]" />
                      <p className="text-xl font-bold mb-2">
                        {t("resilience.dashboardTitle")}
                      </p>
                      <p className="text-white/60">
                        {t("resilience.dashboardSubtitle")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
