import { Metadata } from 'next';
import { ContactHeroSection } from '@/components/marketing/ContactHeroSection';
import { ContactFormSection } from '@/components/marketing/ContactFormSection';
import { ContactGlobalSection } from '@/components/marketing/ContactGlobalSection';
import { ContactCTASection } from '@/components/marketing/ContactCTASection';
import { DEFAULT_BRAND } from '@/lib/branding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us',
    description: `Get in touch with ${DEFAULT_BRAND} support. We offer email support, live chat, and office visits. Contact us for sales inquiries, technical support, or partnership opportunities.`,
    openGraph: {
      title: `Contact Us - ${DEFAULT_BRAND}`,
      description: `Get in touch with ${DEFAULT_BRAND} support. We offer email support, live chat, and office visits.`,
      url: '/contact',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Contact Us - ${DEFAULT_BRAND}`,
      description: `Get in touch with ${DEFAULT_BRAND} support.`,
    },
  };
}

/**
 * Contact Us page - Matches Figma design
 * https://www.figma.com/design/lScDg7yDwbuPXjK5g7KCfC/Credit_Ledger_v4?node-id=11-1541
 */
export default function ContactPage() {
  return (
    <>
      {/* Hero Section - "Get in Touch" */}
      <ContactHeroSection />

      {/* Contact Form + Info Section */}
      <ContactFormSection />

      {/* Global Presence Section */}
      <ContactGlobalSection />

      {/* CTA Section - "Ready to transform your business?" */}
      <ContactCTASection />
    </>
  );
}
