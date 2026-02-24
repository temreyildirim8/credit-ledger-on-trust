import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://global-ledger.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/en",
          "/tr",
          "/es",
          "/hi",
          "/id",
          "/ar",
          "/zu",
          "/en/pricing",
          "/en/about",
          "/en/contact",
          "/en/legal",
          "/tr/pricing",
          "/tr/about",
          "/tr/contact",
          "/tr/legal",
          "/es/pricing",
          "/es/about",
          "/es/contact",
          "/es/legal",
          "/hi/pricing",
          "/hi/about",
          "/hi/contact",
          "/hi/legal",
          "/id/pricing",
          "/id/about",
          "/id/contact",
          "/id/legal",
          "/ar/pricing",
          "/ar/about",
          "/ar/contact",
          "/ar/legal",
          "/zu/pricing",
          "/zu/about",
          "/zu/contact",
          "/zu/legal",
        ],
        disallow: [
          // Protected app routes - require authentication
          "/en/dashboard",
          "/en/customers",
          "/en/transactions",
          "/en/reports",
          "/en/settings",
          "/en/onboarding",
          "/en/quick-add",
          "/en/billing",
          "/en/auth/callback",
          "/tr/dashboard",
          "/tr/customers",
          "/tr/transactions",
          "/tr/reports",
          "/tr/settings",
          "/tr/onboarding",
          "/tr/quick-add",
          "/tr/billing",
          "/tr/auth/callback",
          // API routes
          "/api/",
          // Internal paths
          "/_next/",
          // Auth pages - don't need indexing
          "/*/login",
          "/*/signup",
          "/*/forgot-password",
          "/*/verify-otp",
          "/*/reset-password",
          "/*/reset-success",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
