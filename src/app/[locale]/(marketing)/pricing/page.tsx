import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/routing';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pricing - Global Ledger',
    description: 'Affordable pricing for every business size. Start free, upgrade when you need.',
  };
}

const plans = [
  { key: 'free', icon: null, featured: false },
  { key: 'pro', icon: Star, featured: true },
  { key: 'enterprise', icon: Building2, featured: false },
];

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
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.key}
                  className={`border-2 ${
                    plan.featured
                      ? 'border-[var(--color-accent)] shadow-xl relative'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  {plan.featured && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-accent)]">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    {Icon && (
                      <div className="h-12 w-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                      </div>
                    )}
                    <CardTitle className="font-display text-xl">
                      {t(`${plan.key}.name`)}
                    </CardTitle>
                    <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                      {t(`${plan.key}.description`)}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold text-[var(--color-text)]">
                        {t(`${plan.key}.price`)}
                      </span>
                      {plan.key !== 'enterprise' && (
                        <span className="text-[var(--color-text-secondary)]">
                          /{t(`${plan.key}.period`)}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-3 mb-8">
                      {t.raw(`${plan.key}.features`).map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-[var(--color-text)] text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/login"
                      className="block"
                    >
                      <Button
                        className={`w-full ${
                          plan.featured
                            ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
                            : ''
                        }`}
                        variant={plan.featured ? 'default' : 'outline'}
                      >
                        {t(`${plan.key}.cta`)}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
