import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://global-ledger.app";

// Supported locales
const locales = ["en", "tr", "es", "hi", "id", "ar", "zu"] as const;

// Public pages that should be indexed
const publicPages = [
  "", // Home
  "/pricing",
  "/about",
  "/contact",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for all public pages in all locales
  for (const locale of locales) {
    for (const page of publicPages) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : page === "/pricing" ? 0.9 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}${page}`])
          ),
        },
      });
    }
  }

  // Add auth pages (lower priority, not critical for SEO but useful for discovery)
  const authPages = ["/login", "/signup", "/forgot-password"];
  for (const locale of locales) {
    for (const page of authPages) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return sitemapEntries;
}
