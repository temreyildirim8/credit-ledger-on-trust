import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { TrustBar } from "@/components/marketing/TrustBar";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FAQSection } from "@/components/marketing/FAQSection";
import { CTASection } from "@/components/marketing/CTASection";

/**
 * Marketing landing page - Ledgerly
 * Complete landing page following the 11 essential elements framework:
 * 1. URL with keywords (/)
 * 2. Company Logo (MarketingNavbar in layout)
 * 3. SEO-Optimized Title (HeroSection)
 * 4. Primary CTA (HeroSection)
 * 5. Social Proof (TrustBar)
 * 6. Images/Videos (HeroSection floating cards)
 * 7. Core Benefits (FeaturesSection)
 * 8. Customer Testimonials (Testimonials)
 * 9. FAQ Section (FAQSection)
 * 10. Final CTA (CTASection)
 * 11. Footer (MarketingFooter in layout)
 */
export default function HomePage() {
  return (
    <>
      {/* Element 3-5: Hero Section with Title, CTA, and Social Proof badges */}
      <HeroSection />

      {/* Element 7: Core Benefits/Features */}
      <FeaturesSection />

      {/* Element 5: Social Proof Stats */}
      <TrustBar />

      {/* Element 8: Customer Testimonials */}
      <Testimonials />

      {/* Element 9: FAQ Section */}
      <FAQSection />

      {/* Element 10: Final CTA */}
      <CTASection />
    </>
  );
}
