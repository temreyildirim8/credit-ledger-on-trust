"use client";

import { Link } from "@/routing";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "@/routing";
import { useTranslations } from "next-intl";

/**
 * Marketing navbar - dark green top bar with navigation and CTAs
 */
export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || "en";
  const t = useTranslations('nav');

  const navItems = [
    { name: t('features'), href: `/${locale}/features` },
    { name: t('pricing'), href: `/${locale}/pricing` },
    { name: t('about'), href: `/${locale}/about` },
    { name: t('contact'), href: `/${locale}/contact` },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-accent)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
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
                Global Ledger
              </h1>
              <p className="text-[10px] text-white/70 -mt-1">Veresiye Defteri</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/90 hover:text-white transition-colors text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href={`/${locale}/login`}
              className="text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              {t('login')}
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="bg-white text-[var(--color-accent)] hover:bg-white/90 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {t('signup')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--color-accent)] border-t border-white/10">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-white/90 hover:text-white py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-white/10">
              <Link
                href={`/${locale}/login`}
                className="block text-white/90 hover:text-white py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href={`/${locale}/signup`}
                className="block bg-white text-[var(--color-accent)] hover:bg-white/90 px-4 py-2.5 rounded-lg text-sm font-semibold text-center transition-all duration-200"
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
