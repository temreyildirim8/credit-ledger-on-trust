import { Quote, Star } from "lucide-react";

/**
 * Testimonials section - Shopowner quotes
 */
export function Testimonials() {
  const testimonials = [
    {
      name: "Ahmet Yılmaz",
      role: "Bakkal Owner, Istanbul",
      content: "Global Ledger changed how I manage my customer debts. No more lost notebooks, no more calculation errors.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Kirana Store Owner, Mumbai",
      content: "Finally, an app that understands Hindi and works with rupees! My customers love the SMS reminders.",
      rating: 5,
    },
    {
      name: "Budi Santoso",
      role: "Warung Owner, Jakarta",
      content: "Works perfectly offline. I can record debts even when internet is down in my area.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-surface dark:bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[var(--color-text)] mb-4">
            For business owners going places
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Hear from shop owners who transformed their business with Global Ledger
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[var(--color-bg)] rounded-2xl p-8 relative"
            >
              <Quote className="h-10 w-10 text-[var(--color-accent)]/20 absolute top-6 right-6" />

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-[var(--color-text)] mb-6 leading-relaxed relative">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div>
                <p className="font-semibold text-[var(--color-text)]">
                  {testimonial.name}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
