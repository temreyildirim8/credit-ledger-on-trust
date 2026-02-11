import { Link } from "@/routing";
import { ArrowRight, Check } from "lucide-react";
import { usePathname } from "@/routing";

/**
 * CTA section - Dark green gradient with signup call to action
 */
export function CTASection() {
  const benefits = [
    "Free forever for up to 50 customers",
    "Works 100% offline",
    "No credit card required",
    "Setup in 2 minutes",
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6">
          Meet money without borders
        </h2>
        <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          Join thousands of shop owners who've gone digital. Start tracking your credit ledger today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-accent)] hover:bg-white/90 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-xl hover:shadow-2xl"
          >
            Get Started for Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 text-left">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-white/90">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
