"use client";

import { UserPlus, Receipt, Wallet, Cloud, Shield, TrendingUp, CheckCircle } from "lucide-react";

/**
 * Features section - "How it Works" and "Built for Resilience"
 * Matches Figma design with 3-step process and feature list
 */
export function FeaturesSection() {
  const steps = [
    {
      icon: UserPlus,
      title: "Add Customer",
      description: "Quickly set up profiles for your regular clients in seconds. Import from contacts or add manually.",
    },
    {
      icon: Receipt,
      title: "Record Debt",
      description: "Track sales in real-time. Our system automatically adjusts for inflation to protect your margins.",
    },
    {
      icon: Wallet,
      title: "Get Paid",
      description: "Send automated WhatsApp reminders and payment links. Clear debts faster and improve cash flow.",
    },
  ];

  const features = [
    {
      title: "Inflation Protection",
      description: "Automatically convert debts to stable currencies or adjust based on daily index values to maintain purchasing power.",
    },
    {
      title: "Cloud Sync & Offline Mode",
      description: "Continue recording transactions without internet. Everything syncs instantly once you are back online.",
    },
    {
      title: "Military-Grade Security",
      description: "Your data is encrypted end-to-end. Never worry about losing paper books to fire, theft, or wear and tear.",
    },
  ];

  return (
    <>
      {/* How it Works Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-20">
            <h2 className="text-[36px] font-black leading-[40px] tracking-[-0.9px] text-[#0f172a] mb-6">
              Simple steps to digitize
            </h2>
            <p className="text-[18px] leading-[28px] text-[#475569] max-w-[672px] mx-auto">
              Ditch the paper and start managing your business credit with three simple
              steps designed for efficiency.
            </p>
          </div>

          {/* Steps */}
          <div className="flex gap-8 justify-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex-1 max-w-[389px] bg-white border border-[#e2e8f0] rounded-[48px] p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                >
                  {/* Icon */}
                  <div className="w-16 h-16 bg-[rgba(60,131,246,0.1)] rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-[#3c83f6]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-[20px] font-bold leading-[28px] text-[#0f172a] mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[16px] leading-[26px] text-[#475569]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for Resilience Section */}
      <section className="py-24 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="bg-[#3c83f6] rounded-[48px] py-24 px-6">
            <div className="flex gap-20 items-center justify-center">
              {/* Content */}
              <div className="flex-1 max-w-[576px]">
                <h2 className="text-[48px] font-black leading-[48px] text-white mb-8">
                  Built for Resilience in
                  <br />
                  Inflationary Markets
                </h2>

                {/* Feature List */}
                <div className="space-y-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-9 h-7 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[20px] font-bold leading-[28px] text-white mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-[16px] leading-[24px] text-[#dbeafe] opacity-90">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="flex-1 max-w-[576px] relative">
                {/* Blur decoration */}
                <div className="absolute bg-[rgba(255,255,255,0.1)] blur-[32px] inset-0 rounded-[48px]" />

                {/* Dashboard card */}
                <div className="relative bg-[#0f172a] border border-[rgba(255,255,255,0.1)] rounded-[48px] p-[17px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
                  <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[32px] aspect-square w-full flex items-center justify-center">
                    <div className="text-white text-center p-12">
                      <TrendingUp className="h-20 w-20 mx-auto mb-6 text-[#3c83f6]" />
                      <p className="text-xl font-bold mb-2">Financial Analytics</p>
                      <p className="text-white/60">Track your business performance</p>
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
