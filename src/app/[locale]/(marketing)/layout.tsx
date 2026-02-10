import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

type Props = {
  children: React.ReactNode;
};

/**
 * Marketing Layout - Public pages with Navbar and Footer
 * Used for landing page, about, pricing, etc.
 */
export default function MarketingLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
