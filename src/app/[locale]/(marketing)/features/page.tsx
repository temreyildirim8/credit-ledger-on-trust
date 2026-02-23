import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, DollarSign, WifiOff, Cloud, MessageSquare, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Features - Global Ledger',
    description: 'Explore all the powerful features of Global Ledger credit ledger application',
  };
}

const features = [
  { icon: Languages, key: 'localLanguage' },
  { icon: DollarSign, key: 'multiCurrency' },
  { icon: WifiOff, key: 'offlineMode' },
  { icon: Cloud, key: 'cloudBackup' },
  { icon: MessageSquare, key: 'smsReminders' },
  { icon: BarChart3, key: 'reports' },
];

export default function FeaturesPage() {
  const t = useTranslations('features');

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

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.key} className="border-[var(--color-border)] hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                    </div>
                    <CardTitle className="font-display text-xl">
                      {t(`${feature.key}.title`)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[var(--color-text-secondary)]">
                      {t(`${feature.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-[var(--color-text)] text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: t('howItWorks.step1.title'), description: t('howItWorks.step1.description') },
              { step: '2', title: t('howItWorks.step2.title'), description: t('howItWorks.step2.description') },
              { step: '3', title: t('howItWorks.step3.title'), description: t('howItWorks.step3.description') },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-16 w-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-bold font-display mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                  {item.title}
                </h3>
                <p className="text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </div>
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
