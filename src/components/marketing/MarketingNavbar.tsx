"use client";

import { Link } from "@/routing";
import { Menu, X, BookOpen } from "lucide-react";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/layout/language-switcher/LanguageSwitcher";

/**
 * Marketing navbar - Matches Figma design
 * White background with blur, blue logo, navigation links
 * Figma: https://www.figma.com/design/lScDg7yDwbuPXjK5g7KCfC/Credit_Ledger_v4?node-id=11-1541
 */
export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('nav');
  const pathname = usePathname();

  // Handle scroll to top for Product link when already on homepage
  const handleProductClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if we're on the homepage (locale-prefixed path like /en, /tr, etc.)
    const isHomePage = pathname === "/" || /^\/[a-z]{2}$/.test(pathname) || /^\/[a-z]{2}\/$/.test(pathname);

    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  }, [pathname]);

  // Nav items matching Figma design: Product, Features, Pricing, Company
  const navItems = [
    { name: t('product'), href: "/", onClick: handleProductClick },
    { name: t('features'), href: "/features" },
    { name: t('pricing'), href: "/pricing" },
    { name: t('company'), href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-[6px] bg-white/80 border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto h-20 px-6 lg:px-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#3c83f6] flex items-center justify-center">
            <BookOpen className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-extrabold text-xl text-[#0f172a] tracking-tight">
            {t('brandName')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={item.onClick}
              className="text-sm font-semibold text-[#0f172a] hover:text-[#3c83f6] transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs - matching Figma design */}
        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher variant="icon" />
          <Link
            href="/login"
            className="text-sm font-bold text-[#0f172a] hover:text-[#3c83f6] transition-colors px-4 py-2"
          >
            {t('login')}
          </Link>
          <Link
            href="/signup"
            className="bg-[#3c83f6] text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#3b82f6] transition-colors shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.2),0px_4px_6px_-4px_rgba(60,131,246,0.2)]"
          >
            {t('getStarted')}
          </Link>
        </div>

        {/* Mobile menu button - always visible on mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-slate-900" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6 text-slate-900" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="lg:hidden bg-white border-t border-slate-200">
          <div className="px-6 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-semibold text-[#0f172a] hover:text-[#3c83f6] hover:bg-slate-50 py-3 px-2 rounded-lg transition-colors"
                onClick={(e) => {
                  if (item.onClick) {
                    item.onClick(e);
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 space-y-2 border-t border-slate-200 mt-3">
              <div className="py-3 px-2">
                <LanguageSwitcher variant="compact" />
              </div>
              <Link
                href="/login"
                className="block text-sm font-semibold text-[#0f172a] hover:text-[#3c83f6] py-3 px-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href="/signup"
                className="block bg-[#3c83f6] text-white text-sm font-bold px-4 py-3 rounded-lg text-center transition-colors shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.2)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('getStarted')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
