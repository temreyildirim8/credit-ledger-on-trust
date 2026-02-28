import { Quote, Star } from "lucide-react";
import { useLocale } from "next-intl";
import { getBrandName } from "@/lib/branding";

/**
 * Testimonials section - Shopowner quotes
 */
export function Testimonials() {
  const locale = useLocale();
  const brandName = getBrandName(locale);

  const testimonials = [
    {
      name: "Ahmet Yılmaz",
      role: "Bakkal Owner, Istanbul",
      content: `${brandName} changed how I manage my customer debts. No more lost notebooks, no more calculation errors.`,
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Kirana Store Owner, Mumbai",
      content:
        "Finally, an app that understands Hindi and works with rupees! My customers love the SMS reminders.",
      rating: 5,
    },
    {
      name: "Budi Santoso",
      role: "Warung Owner, Jakarta",
      content:
        "Works perfectly offline. I can record debts even when internet is down in my area.",
      rating: 5,
    },
  ];

  return (
    <section className="bg-[#f5f7f8] px-5 py-16 md:py-24 md:px-20">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-[36px] font-extrabold leading-tight md:leading-[1.2] tracking-[-0.025em] md:tracking-[-0.9px] text-[#0f172a] mb-3 md:mb-4">
            For business owners going places
          </h2>
          <p className="text-base md:text-[18px] leading-relaxed md:leading-[28px] text-[#475569] max-w-[672px] mx-auto">
            Hear from shop owners who transformed their business with{" "}
            {brandName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 md:p-8 relative shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <Quote className="h-8 w-8 md:h-10 md:w-10 text-[#3c83f6]/20 absolute top-4 md:top-6 right-4 md:right-6" />

              <div className="flex gap-1 mb-3 md:mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-sm md:text-base text-[#0f172a] mb-4 md:mb-6 leading-relaxed relative">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div>
                <p className="font-semibold text-sm md:text-base text-[#0f172a]">
                  {testimonial.name}
                </p>
                <p className="text-xs md:text-sm text-[#64748b]">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
