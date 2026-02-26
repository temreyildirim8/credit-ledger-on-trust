"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";

type BillingInterval = "monthly" | "yearly";
type PlanKey = "free" | "pro" | "enterprise";

interface PriceInfo {
  price: string;
  periodKey: string;
  savings?: string;
}

const plans: Array<{
  key: PlanKey;
  icon: React.ComponentType<{ className?: string }> | null;
  featured: boolean;
}> = [
  { key: "free", icon: null, featured: false },
  { key: "pro", icon: Star, featured: true },
  { key: "enterprise", icon: Building2, featured: false },
];

// Pricing data for monthly and yearly billing
const pricingData: Record<PlanKey, Record<BillingInterval, PriceInfo>> = {
  free: {
    monthly: { price: "$0", periodKey: "periods.forever" },
    yearly: { price: "$0", periodKey: "periods.forever" },
  },
  pro: {
    monthly: { price: "$4.99", periodKey: "periods.month" },
    yearly: { price: "$49", periodKey: "periods.year", savings: "Save 17%" },
  },
  enterprise: {
    monthly: { price: "Custom", periodKey: "periods.contact" },
    yearly: { price: "Custom", periodKey: "periods.contact" },
  },
};

/**
 * Pricing Cards - Figma design
 * White cards, blue accent for PRO, rounded-xl, checkmark features
 */
export function PricingCards() {
  const t = useTranslations("pricing");
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  return (
    <div>
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-2 mb-20">
        <span
          className={`text-sm font-medium transition-colors ${
            billingInterval === "monthly" ? "text-[#0f172a]" : "text-[#64748b]"
          }`}
        >
          {t("monthly")}
        </span>
        <button
          onClick={() =>
            setBillingInterval((prev) =>
              prev === "monthly" ? "yearly" : "monthly",
            )
          }
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2"
          style={{
            backgroundColor:
              billingInterval === "yearly" ? "#3c83f6" : "#e2e8f0",
          }}
          aria-label={t("toggleBilling")}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              billingInterval === "yearly" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${
            billingInterval === "yearly" ? "text-[#0f172a]" : "text-[#64748b]"
          }`}
        >
          {t("yearly")}
        </span>
        <Badge variant="secondary" className="bg-[#dcfce7] text-[#16a34a]">
          {t("save17")}
        </Badge>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 items-end">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const priceInfo = pricingData[plan.key][billingInterval];

          return (
            <Card
              key={plan.key}
              className={`border-2 flex flex-col ${
                plan.featured
                  ? "border-[#3c83f6] shadow-2xl relative z-10 md:scale-105 md:-my-4 bg-white"
                  : "border-[#e2e8f0]"
              }`}
            >
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3c83f6]">
                  {t("mostPopular")}
                </Badge>
              )}
              <CardHeader className="text-center pb-4">
                {Icon && (
                  <div className="h-12 w-12 rounded-full bg-[rgba(60,131,246,0.1)] flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-[#3c83f6]" />
                  </div>
                )}
                <CardTitle className="text-xl">
                  {t(`${plan.key}.name`)}
                </CardTitle>
                <p className="text-[#64748b] text-sm mt-2">
                  {t(`${plan.key}.description`)}
                </p>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col flex-1">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-[#0f172a]">
                    {priceInfo.price}
                  </span>
                  {plan.key !== "enterprise" && (
                    <span className="text-[#64748b]">
                      /{t(priceInfo.periodKey)}
                    </span>
                  )}
                  {plan.key === "pro" && (
                    <div
                      className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
                        billingInterval === "yearly"
                          ? "grid-rows-[1fr] opacity-100 mt-2"
                          : "grid-rows-[0fr] opacity-0 mt-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <Badge
                          variant="secondary"
                          className="bg-[#dcfce7] text-[#16a34a] text-xs"
                        >
                          {t("save17")}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {t
                    .raw(`${plan.key}.features`)
                    .map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-[#16a34a] flex-shrink-0 mt-0.5" />
                        <span className="text-[#0f172a] text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                </ul>
                <div className="mt-auto">
                  <CheckoutButton
                    plan={plan.key}
                    featured={plan.featured}
                    interval={billingInterval}
                  >
                    {t(`${plan.key}.cta`)}
                  </CheckoutButton>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
