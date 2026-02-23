"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/**
 * FAQ section - Frequently Asked Questions with accordion UI
 * Element 9 of 11 essential landing page elements
 */
export function FAQSection() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: t('q1'),
      answer: t('a1'),
    },
    {
      question: t('q2'),
      answer: t('a2'),
    },
    {
      question: t('q3'),
      answer: t('a3'),
    },
    {
      question: t('q4'),
      answer: t('a4'),
    },
    {
      question: t('q5'),
      answer: t('a5'),
    },
    {
      question: t('q6'),
      answer: t('a6'),
    },
  ];

  return (
    <section className="py-20 bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-2">
            {t('badge')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[var(--color-text)] mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-[var(--color-text)] pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-[var(--color-text-secondary)] transition-transform duration-300 flex-shrink-0",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="px-6 pb-6 text-[var(--color-text-secondary)] leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">
            {t('stillHaveQuestions')}
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center gap-2 text-[var(--color-accent)] font-semibold hover:underline"
          >
            {t('contactSupport')}
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
          </a>
        </div>
      </div>
    </section>
  );
}
