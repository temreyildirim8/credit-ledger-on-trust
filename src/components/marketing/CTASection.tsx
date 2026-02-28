import { Link } from "@/routing";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * CTA section - Dark background with signup call to action
 * Matches About page CTA pattern with rounded dark container
 */
export function CTASection() {
  const t = useTranslations("cta");

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
    t("benefit5"),
    t("benefit6"),
  ];

  return (
    <section className="px-5 py-16 md:py-24 md:px-20">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative overflow-hidden rounded-2xl md:rounded-[32px] bg-[#0f172a] px-6 md:px-16 py-12 md:py-24">
          {/* Decorative blurs */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[rgba(60,131,246,0.2)] blur-[50px]" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[rgba(60,131,246,0.2)] blur-[50px]" />

          {/* Content */}
          <div className="relative mx-auto flex max-w-[768px] flex-col items-center gap-4 md:gap-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-[36px] font-extrabold leading-tight md:leading-[1.2] tracking-[-0.025em] text-white lg:text-[48px] lg:leading-[48px]">
              {t("title")}
            </h2>
            <p className="max-w-[730px] text-base md:text-[18px] leading-relaxed md:leading-[28px] text-[#cbd5e1]">
              {t("description")}
            </p>

            <div className="mt-2 md:mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-[#3c83f6] px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-[18px] font-bold text-white transition-colors hover:bg-[#2563eb]"
              >
                {t("cta")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-2 md:mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-3xl w-full">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  </div>
                  <span className="text-white/90 text-xs md:text-[14px]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
