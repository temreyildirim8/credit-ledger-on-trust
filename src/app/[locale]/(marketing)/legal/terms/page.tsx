import { useTranslations } from 'next-intl';
import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from '@/routing';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms of Service',
    description: 'Terms and conditions governing your use of Global Ledger services. Read our service agreement, acceptable use policy, and user responsibilities.',
    openGraph: {
      title: 'Terms of Service - Global Ledger',
      description: 'Terms and conditions governing your use of Global Ledger services.',
      url: '/legal/terms',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function TermsOfServicePage() {
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
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display">
              {t('items.terms.title')}
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
                {t('termsPage.intro')}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-8">
            {/* Acceptance of Terms */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.acceptance.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.acceptance.content')}
                </p>
              </CardContent>
            </Card>

            {/* Description of Service */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.description.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.description.content')}
                </p>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.accounts.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.accounts.content')}
                </p>
              </CardContent>
            </Card>

            {/* Acceptable Use */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.acceptable.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.acceptable.content')}
                </p>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.payment.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.payment.content')}
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.termination.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.termination.content')}
                </p>
              </CardContent>
            </Card>

            {/* Limitation of Liability */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.limitation.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.limitation.content')}
                </p>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.changes.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.changes.content')}
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
                  {t('termsPage.sections.contact.title')}
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {t('termsPage.sections.contact.content')}
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
