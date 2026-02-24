"use client";

import { Link } from "@/routing";
import { Github, Twitter, Linkedin } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Marketing footer - Multi-column links and social icons
 */
export function MarketingFooter() {
  const t = useTranslations('nav');

  const footerSections = [
    {
      title: "Product",
      links: [
        { name: t('features'), href: "/features" },
        { name: t('pricing'), href: "/pricing" },
        { name: "Security", href: "#" },
        { name: "FAQ", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: t('about'), href: "/about" },
        { name: "Blog", href: "#" },
        { name: "Careers", href: "#" },
        { name: t('contact'), href: "/contact" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Documentation", href: "#" },
        { name: "Community", href: "#" },
        { name: "Status", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy", href: "#" },
        { name: "Terms", href: "#" },
        { name: "Cookies", href: "#" },
        { name: "Licenses", href: "#" },
      ],
    },
  ];

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "GitHub", icon: Github, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
  ];

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and description */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
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
                <h3 className="font-display font-bold text-lg">Global Ledger</h3>
                <p className="text-xs text-gray-400 -mt-1">Veresiye Defteri</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Digital credit ledger for micro-SMEs. Replace your paper notebook with a smart, secure, and always-available solution.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-11 h-11 rounded-full bg-gray-800 hover:bg-[var(--color-accent)] flex items-center justify-center transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm py-1.5 block min-h-[44px] flex items-center"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 Global Ledger. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors py-1.5 min-h-[44px] flex items-center">
              {t('login')}
            </Link>
            <Link href="/signup" className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium py-1.5 min-h-[44px] flex items-center">
              {t('signup')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
