"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname, routing, type Locale } from "@/routing";
import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import styles from "./LanguageSwitcher.module.css";

const localeNames: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  es: "Español",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  ar: "العربية",
  zu: "isiZulu",
};

const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  tr: "🇹🇷",
  es: "🇪🇸",
  hi: "🇮🇳",
  id: "🇮🇩",
  ar: "🇸🇦",
  zu: "🇿🇦",
};

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className={styles.flag}>{localeFlags[locale]}</span>
        <span className={styles.label}>{localeNames[locale]}</span>
        <svg
          className={clsx(styles.icon, isOpen && styles.iconOpen)}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {routing.locales.map((loc: Locale) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={clsx(
                styles.option,
                locale === loc && styles.optionActive,
              )}
              disabled={locale === loc}
            >
              <span className={styles.optionFlag}>{localeFlags[loc]}</span>
              <span className={styles.optionLabel}>{localeNames[loc]}</span>
              {locale === loc && (
                <svg
                  className={styles.check}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M13.3333 4L6 11.3333L2.66667 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
