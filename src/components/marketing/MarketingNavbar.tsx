"use client";

import { Link } from "@/routing";
import { Menu, X, BookOpen } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Marketing navbar - Matches Figma design
 * White background with blur, blue logo, navigation links
 */
export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('nav');

  const navItems = [
    { name: t('features'), href: "/features" },
    { name: t('howItWorks') || "How it Works", href: "/#features" },
    { name: t('pricing'), href: "/pricing" },
    { name: t('reviews') || "Reviews", href: "/#testimonials" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-[6px] bg-white/80 border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto h-20 px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-[32px] bg-[#3c83f6] flex items-center justify-center p-1.5">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">
            Global Ledger
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-slate-900 hover:text-[#3c83f6] transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-bold text-slate-900 hover:text-[#3c83f6] transition-colors px-5 py-2.5 rounded-full"
          >
            {t('login')}
          </Link>
          <Link
            href="/signup"
            className="bg-[#3c83f6] text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-[#3b82f6] transition-colors shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25),0px_4px_6px_-4px_rgba(60,131,246,0.25)]"
          >
            {t('signup')}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
                className="block text-sm font-semibold text-slate-900 hover:text-[#3c83f6] hover:bg-slate-50 py-3 px-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 space-y-2 border-t border-slate-200 mt-3">
              <Link
                href="/login"
                className="block text-sm font-semibold text-slate-900 hover:text-[#3c83f6] py-3 px-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href="/signup"
                className="block bg-[#3c83f6] text-white text-sm font-bold px-4 py-3 rounded-full text-center transition-colors shadow-[0px_10px_15px_-3px_rgba(60,131,246,0.25)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('signup')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
