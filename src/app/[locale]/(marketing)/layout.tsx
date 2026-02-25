import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ForceLightTheme } from "@/components/theme/ForceLightTheme";

type Props = {
  children: React.ReactNode;
};

/**
 * Marketing Layout - Public pages with Navbar and Footer
 * Used for landing page, about, pricing, etc.
 * Forces light theme for consistent marketing experience
 */
export default function MarketingLayout({ children }: Props) {
  return (
    <ForceLightTheme>
      <div className="min-h-screen flex flex-col">
        <MarketingNavbar />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </ForceLightTheme>
  );
}
