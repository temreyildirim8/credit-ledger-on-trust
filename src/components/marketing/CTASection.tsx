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
    <section className="px-5 py-24 md:px-20">
      <div className="max-w-[1280px] mx-auto">
        <div className="relative overflow-hidden rounded-[32px] bg-[#0f172a] px-16 py-24">
          {/* Decorative blurs */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[rgba(60,131,246,0.2)] blur-[50px]" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[rgba(60,131,246,0.2)] blur-[50px]" />

          {/* Content */}
          <div className="relative mx-auto flex max-w-[768px] flex-col items-center gap-6 text-center">
            <h2 className="text-[36px] font-extrabold leading-[1.2] tracking-[-0.025em] text-white md:text-[48px] md:leading-[48px]">
              {t("title")}
            </h2>
            <p className="max-w-[730px] text-[18px] leading-[28px] text-[#cbd5e1]">
              {t("description")}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-[#3c83f6] px-8 py-4 rounded-xl text-[18px] font-bold text-white transition-colors hover:bg-[#2563eb]"
              >
                {t("cta")}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl w-full">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/90 text-[14px]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
