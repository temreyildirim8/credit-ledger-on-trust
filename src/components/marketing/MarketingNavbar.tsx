"use client";

import { Link } from "@/routing";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getBrandName } from "@/lib/branding";

/**
 * Marketing navbar - dark green top bar with navigation and CTAs
 */
export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('nav');
  const locale = useLocale();
  const brandName = getBrandName(locale);

  const navItems = [
    { name: t('features'), href: "/features" },
    { name: t('pricing'), href: "/pricing" },
    { name: t('about'), href: "/about" },
    { name: t('contact'), href: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-accent)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M12 2L2 7V17C2 18.1 2.9 19 4 19H20C21.1 19 22 18.1 22 17V7L12 2Z"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <path
                  d="M12 2L2 7V17C2 18.1 2.9 19 4 19H20C21.1 19 22 18.1 22 17V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 10V16M12 16L9 13M12 16L15 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">
                {brandName}
              </h1>
              <p className="text-[10px] text-white/70 -mt-1">Credit Ledger</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/90 hover:text-white transition-colors text-sm font-medium py-2 px-1 min-h-[44px] flex items-center"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-white/90 hover:text-white transition-colors text-sm font-medium py-2 px-1 min-h-[44px] flex items-center"
            >
              {t('login')}
            </Link>
            <Link
              href="/signup"
              className="bg-white text-[var(--color-accent)] hover:bg-white/90 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl min-h-[44px] flex items-center"
            >
              {t('signup')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden bg-[var(--color-accent)] border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-white/90 hover:text-white hover:bg-white/10 py-3 px-2 text-sm font-medium min-h-[48px] flex items-center rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 space-y-2 border-t border-white/10 mt-3">
              <Link
                href="/login"
                className="block text-white/90 hover:text-white hover:bg-white/10 py-3 px-2 text-sm font-medium min-h-[48px] flex items-center rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href="/signup"
                className="block bg-white text-[var(--color-accent)] hover:bg-white/90 px-4 py-3 rounded-lg text-sm font-semibold text-center transition-all duration-200 min-h-[48px] flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('signup')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
