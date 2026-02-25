"use client";

import { Link } from "@/routing";
import { Github, Twitter, Linkedin, BookOpen } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getBrandName } from "@/lib/branding";

/**
 * Marketing footer - Multi-column links and social icons
 */
export function MarketingFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const brandName = getBrandName(locale);

  const footerSections = [
    {
      title: t("product.title"),
      links: [
        { name: tNav("features"), href: "/features" },
        { name: tNav("pricing"), href: "/pricing" },
        { name: t("product.security"), href: "#" }, // TODO: Add security page URL
        { name: t("product.faq"), href: "/#faq" },
      ],
    },
    {
      title: t("company.title"),
      links: [
        { name: tNav("about"), href: "/about" },
        { name: t("company.blog"), href: "#" },
        { name: t("company.careers"), href: "#" },
        { name: tNav("contact"), href: "/contact" },
      ],
    },
    {
      title: t("resources.title"),
      links: [
        { name: t("resources.helpCenter"), href: "#" },
        { name: t("resources.documentation"), href: "#" },
        { name: t("resources.community"), href: "#" },
        { name: t("resources.status"), href: "#" },
      ],
    },
    {
      title: t("legal.title"),
      links: [
        { name: t("legal.privacy"), href: "#" },
        { name: t("legal.terms"), href: "#" },
        { name: t("legal.cookies"), href: "#" },
        { name: t("legal.licenses"), href: "#" },
      ],
    },
  ];

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "" }, // TODO: Add social URLs
    { name: "GitHub", icon: Github, href: "" },
    { name: "LinkedIn", icon: Linkedin, href: "" },
  ];

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and description */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">{brandName}</h3>
                <p className="text-xs text-gray-400 -mt-1">{t("tagline")}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t("description")}
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                // Render as span if no href (coming soon)
                if (!social.href) {
                  return (
                    <span
                      key={social.name}
                      className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center opacity-50 cursor-not-allowed"
                      aria-label={`${social.name} (coming soon)`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  );
                }
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
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors text-sm py-1.5 block min-h-[44px] flex items-center"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-sm py-1.5 block min-h-[44px] flex items-center cursor-not-allowed">
                        {link.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            {t("copyright", {
              year: new Date().getFullYear(),
              brand: brandName,
            })}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/login"
              className="text-gray-400 hover:text-white transition-colors py-1.5 min-h-[44px] flex items-center"
            >
              {tNav("login")}
            </Link>
            <Link
              href="/signup"
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors font-medium py-1.5 min-h-[44px] flex items-center"
            >
              {tNav("signup")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
