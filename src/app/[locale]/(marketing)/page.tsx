import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { TrustBar } from "@/components/marketing/TrustBar";
import { Testimonials } from "@/components/marketing/Testimonials";
import { CTASection } from "@/components/marketing/CTASection";

/**
 * Marketing landing page - Global Ledger
 * Complete landing page with hero, features, trust bar, testimonials, and CTA
 */
export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Trust Bar */}
      <TrustBar />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <CTASection />
    </>
  );
}
