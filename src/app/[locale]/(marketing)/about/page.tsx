import { Metadata } from 'next';
import { AboutHeroSection } from '@/components/marketing/AboutHeroSection';
import { AboutStorySection } from '@/components/marketing/AboutStorySection';
import { AboutLocalFocusSection } from '@/components/marketing/AboutLocalFocusSection';
import { AboutTrustSection } from '@/components/marketing/AboutTrustSection';
import { AboutCTASection } from '@/components/marketing/AboutCTASection';
import { DEFAULT_BRAND } from '@/lib/branding';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About Us',
    description: `${DEFAULT_BRAND} helps micro-SMEs in emerging markets digitize their credit ledger. Our mission is to replace paper notebooks with smart, secure, and accessible tools for small business owners.`,
    openGraph: {
      title: `About Us - ${DEFAULT_BRAND}`,
      description: `${DEFAULT_BRAND} helps micro-SMEs in emerging markets digitize their credit ledger. Learn about our mission to empower small businesses.`,
      url: '/about',
    },
    twitter: {
      card: 'summary_large_image',
      title: `About Us - ${DEFAULT_BRAND}`,
      description: `${DEFAULT_BRAND} helps micro-SMEs in emerging markets digitize their credit ledger.`,
    },
  };
}

/**
 * About Us page - Matches Figma design
 * https://www.figma.com/design/lScDg7yDwbuPXjK5g7KCfC/Credit_Ledger_v4?node-id=11-1717
 */
export default function AboutPage() {
  return (
    <>
      {/* Hero Section - "Digitizing 100M+ Micro-SMEs" */}
      <AboutHeroSection />

      {/* Story Section - "Our Story: From Paper to Cloud" */}
      <AboutStorySection />

      {/* Hyper-Local Focus Section - Regional cards */}
      <AboutLocalFocusSection />

      {/* Built for Trust Section - Security features */}
      <AboutTrustSection />

      {/* CTA Section - "Ready to join the digital revolution?" */}
      <AboutCTASection />
    </>
  );
}
