import { Globe, DollarSign, Cloud } from "lucide-react";

/**
 * Features section - Built for the way you do business
 */
export function FeaturesSection() {
  const features = [
    {
      icon: Globe,
      title: "Local Language Support",
      description: "Available in Turkish, Hindi, Indonesian, Arabic, and more. The app speaks your language.",
    },
    {
      icon: DollarSign,
      title: "Multi-Currency Protection",
      description: "Supports TRY, INR, IDR, NGN, EGP, ZAR, and more. Always see amounts in your currency.",
    },
    {
      icon: Cloud,
      title: "Automatic Cloud Backups",
      description: "Your data is safely backed up to the cloud. Never lose your credit records again.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[var(--color-text)] mb-4">
            Built for the way you do business
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            From the bazaar in Istanbul to the market in Jakarta, Global Ledger adapts to your local needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-[var(--color-bg)] hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[var(--color-accent)]"
              >
                <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-6 group-hover:bg-[var(--color-accent)] transition-colors duration-300">
                  <Icon className="h-7 w-7 text-[var(--color-accent)] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Offline Badge */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-[var(--color-accent)] text-white px-6 py-3 rounded-full shadow-lg">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Works 100% Offline</span>
          </div>
        </div>
      </div>
    </section>
  );
}
