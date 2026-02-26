"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Link } from "@/routing";

/**
 * FAQ section - Frequently Asked Questions with accordion UI
 * Element 9 of 11 essential landing page elements
 */
export function FAQSection() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: t("q1"),
      answer: t("a1"),
    },
    {
      question: t("q2"),
      answer: t("a2"),
    },
    {
      question: t("q3"),
      answer: t("a3"),
    },
    {
      question: t("q4"),
      answer: t("a4"),
    },
    {
      question: t("q5"),
      answer: t("a5"),
    },
    {
      question: t("q6"),
      answer: t("a6"),
    },
  ];

  return (
    <section id="faq" className="bg-white px-5 py-24 md:px-20">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[#3c83f6] uppercase tracking-wide mb-2">
            {t("badge")}
          </p>
          <h2 className="text-[36px] font-extrabold leading-[1.2] tracking-[-0.9px] text-[#0f172a] mb-4">
            {t("title")}
          </h2>
          <p className="text-[18px] leading-[28px] text-[#475569] max-w-[672px] mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#f8fafc] rounded-2xl border border-[#f1f5f9] overflow-hidden transition-all duration-300 hover:border-[#e2e8f0]"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-[#0f172a] pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-[#64748b] transition-transform duration-300 flex-shrink-0",
                    openIndex === index && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0",
                )}
              >
                <div className="px-6 pb-6 text-[#475569] text-[16px] leading-[26px]">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-[#64748b] mb-4">{t("stillHaveQuestions")}</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 text-[#3c83f6] font-semibold hover:underline"
          >
            {t("contactSupport")}
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
