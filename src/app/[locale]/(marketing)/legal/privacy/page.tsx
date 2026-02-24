import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from '@/routing';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy',
    description: 'Learn how Global Ledger collects, uses, and protects your personal information. We are committed to safeguarding your privacy and ensuring GDPR compliance.',
    openGraph: {
      title: 'Privacy Policy - Global Ledger',
      description: 'Learn how Global Ledger collects, uses, and protects your personal information.',
      url: '/legal/privacy',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PrivacyPolicyPage() {
  const t = useTranslations('legal');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/legal"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Legal Center
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display">
              {t('items.privacy.title')}
            </h1>
          </div>
          <p className="text-white/80">{t('lastUpdated')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-[var(--color-border)] mb-8">
            <CardContent className="p-8">
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {t('privacyPage.intro')}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-8">
            {/* Information We Collect */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('privacyPage.sections.collect.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('privacyPage.sections.collect.content')}
                </p>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('privacyPage.sections.use.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('privacyPage.sections.use.content')}
                </p>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('privacyPage.sections.sharing.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('privacyPage.sections.sharing.content')}
                </p>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('privacyPage.sections.security.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('privacyPage.sections.security.content')}
                </p>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('privacyPage.sections.rights.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('privacyPage.sections.rights.content')}
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('privacyPage.sections.contact.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('privacyPage.sections.contact.content')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
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
    </div>
  );
}
