import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // A list of all locales that are supported
  // en: English, tr: Turkish, es: Spanish
  // hi: Hindi (India), id: Indonesian (Indonesia)
  // ar: Arabic (Egypt) - RTL, zu: Zulu (South Africa)
  locales: ["en", "tr", "es", "hi", "id", "ar", "zu"],

  // Used when no locale matches
  defaultLocale: "en",

  // Always use locale prefix
  localePrefix: "always",

  // RTL locales
  // Note: next-intl automatically detects RTL based on locale
});

export type Locale = (typeof routing.locales)[number];

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
