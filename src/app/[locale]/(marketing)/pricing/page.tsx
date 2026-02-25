import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import { Link } from '@/routing';
import { DEFAULT_BRAND } from '@/lib/branding';
import { PricingCards } from '@/components/pricing/PricingCards';
import { FAQSection } from '@/components/marketing/FAQSection';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pricing',
    description: 'Affordable pricing plans for micro-SMEs. Start free with 10 customers, upgrade to Pro for unlimited customers and SMS reminders. No credit card required.',
    openGraph: {
      title: `Pricing - ${DEFAULT_BRAND}`,
      description: 'Affordable pricing plans for micro-SMEs. Start free with 10 customers, upgrade to Pro for unlimited customers and SMS reminders.',
      url: '/pricing',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Pricing - ${DEFAULT_BRAND}`,
      description: 'Affordable pricing plans for micro-SMEs. Start free, upgrade when you need.',
    },
  };
}

export default function PricingPage() {
  const t = useTranslations('pricing');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-white/90">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-surface dark:bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-4">
          <PricingCards />
        </div>
      </section>

      {/* FAQ Section - Same as homepage */}
      <FAQSection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-display mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-white/90 mb-8">
            {t('cta.description')}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-accent)] hover:bg-white/90 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-xl hover:shadow-2xl"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </div>
  );
}
