import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/routing';
import { DEFAULT_BRAND } from '@/lib/branding';
import { PricingCards } from '@/components/pricing/PricingCards';

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

      {/* FAQ Section */}
      <section className="py-20 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-[var(--color-text)] text-center mb-12">
            {t('faq.title')}
          </h2>
          <div className="space-y-6">
            {[
              {
                qKey: 'faq.q1',
                aKey: 'faq.a1',
              },
              {
                qKey: 'faq.q2',
                aKey: 'faq.a2',
              },
              {
                qKey: 'faq.q3',
                aKey: 'faq.a3',
              },
              {
                qKey: 'faq.q4',
                aKey: 'faq.a4',
              },
            ].map((faq, index) => (
              <Card key={index} className="border-[var(--color-border)]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-[var(--color-text)] mb-2">{t(faq.qKey)}</h3>
                  <p className="text-[var(--color-text-secondary)]">{t(faq.aKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
