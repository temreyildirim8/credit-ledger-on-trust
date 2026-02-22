'use client';

import { Link } from "@/routing";
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '../language-switcher';

export default function Navbar() {
  const t = useTranslations('nav');

  const navItems = [
    { key: 'features', href: '#features' },
    { key: 'pricing', href: '#pricing' },
    { key: 'about', href: '/about' },
    { key: 'contact', href: '#contact' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <Link href="/" className="navbar__logo">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="4" y="4" width="24" height="24" rx="6" fill="var(--color-accent)" />
            <path
              d="M12 16L15 19L20 13"
              stroke="var(--color-bg)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="navbar__brand">SaaS</span>
        </Link>

        <div className="navbar__links">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="navbar__link"
            >
              {t(item.key as 'features' | 'pricing' | 'about' | 'contact')}
            </Link>
          ))}
        </div>

        <div className="navbar__actions">
          <LanguageSwitcher />
          <Link href="/login" className="navbar__cta">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
