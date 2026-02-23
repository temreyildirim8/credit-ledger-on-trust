import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Cookie, Scale, Lock, Gavel } from 'lucide-react';
import { Link } from '@/routing';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Legal Center - Global Ledger',
    description: 'Legal information, privacy policy, terms of service, and compliance documentation for Global Ledger.',
  };
}

const legalItems = [
  {
    icon: Shield,
    key: 'privacy',
    href: '/legal/privacy',
  },
  {
    icon: FileText,
    key: 'terms',
    href: '/legal/terms',
  },
  {
    icon: Cookie,
    key: 'cookies',
    href: '/legal/cookies',
  },
  {
    icon: Scale,
    key: 'compliance',
    href: '/legal/compliance',
  },
  {
    icon: Lock,
    key: 'security',
    href: '/legal/security',
  },
  {
    icon: Gavel,
    key: 'licensing',
    href: '/legal/licensing',
  },
];

export default function LegalCenterPage() {
  const t = useTranslations('legal');

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

      {/* Legal Documents Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {legalItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.key} href={item.href}>
                  <Card className="border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-lg transition-all duration-200 h-full cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--color-text)] mb-2">
                            {t(`items.${item.key}.title`)}
                          </h3>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {t(`items.${item.key}.description`)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold font-display text-[var(--color-text)] mb-4">
            {t('contact.title')}
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            {t('contact.description')}
          </p>
          <Link href="/contact">
            <Button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">
              {t('contact.button')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Last Updated */}
      <section className="py-8 bg-white border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('lastUpdated')}
          </p>
        </div>
      </section>
    </div>
  );
}
