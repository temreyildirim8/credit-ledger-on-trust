import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Users, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About Us - Global Ledger',
    description: 'Learn more about Global Ledger\'s mission to democratize credit management for micro-SMEs',
  };
}

const features = [
  { icon: Award, key: 'mission' },
  { icon: Users, key: 'vision' },
  { icon: Shield, key: 'values' },
  { icon: Zap, key: 'impact' },
];

export default function AboutPage() {
  const t = useTranslations('about');

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

      {/* Intro Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed text-center">
            {t('intro')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-[var(--color-border)]">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-display text-[var(--color-text)] mb-3">
                    {t('mission.title')}
                  </h2>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {t('mission.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-[var(--color-border)]">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-display text-[var(--color-text)] mb-3">
                    {t('vision.title')}
                  </h2>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {t('vision.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-[var(--color-text)] text-center mb-12">
            {t('values.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.raw('values.items').map((value: string, index: number) => (
              <Card key={index} className="border-[var(--color-border)]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <p className="text-[var(--color-text)]">{value}</p>
                  </div>
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
