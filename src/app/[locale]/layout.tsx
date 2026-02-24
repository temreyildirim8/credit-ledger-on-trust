import type { Metadata, Viewport } from "next";
import { Manrope, Inter, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing, type Locale } from "@/routing";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProviderWrapper } from "@/components/auth/AuthProviderWrapper";
import { getBrandName } from "@/lib/branding";
import "../globals.css";

// Ledgerly font pairing - Manrope for display/headings, Inter for body/numbers
// Figma spec: Manrope for display, Inter for body text
const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Arabic font for RTL support
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Industry-specific metadata configurations
const industryMetadata: Record<
  string,
  (
    locale: Locale,
    t: (key: string) => string,
  ) => { title: string; description: string }
> = {
  general: (locale, t) => ({
    title: t("metadata.general.title"),
    description: t("metadata.general.description"),
  }),
  fintech: (locale, t) => ({
    title: t("metadata.fintech.title"),
    description: t("metadata.fintech.description"),
  }),
  ecommerce: (locale, t) => ({
    title: t("metadata.ecommerce.title"),
    description: t("metadata.ecommerce.description"),
  }),
  healthcare: (locale, t) => ({
    title: t("metadata.healthcare.title"),
    description: t("metadata.healthcare.description"),
  }),
};

// Locale to Open Graph locale mapping
const localeToOGLocale: Record<string, string> = {
  en: "en_US",
  tr: "tr_TR",
  es: "es_ES",
  hi: "hi_IN",
  id: "id_ID",
  ar: "ar_AR",
  zu: "zu_ZA",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    console.warn("Unknown locale in layout:", locale);
  }
  // Get messages for the locale
  const messages = await getMessages({ locale });
  const t = (key: string) => {
    const keys = key.split(".");
    let value: unknown = messages;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (typeof value === 'string' ? value : key);
  };

  // Get industry from environment or default to 'general'
  const industry = (process.env.NEXT_PUBLIC_INDUSTRY ||
    "general") as keyof typeof industryMetadata;
  const getMetadata = industryMetadata[industry] || industryMetadata.general;
  const metadata = getMetadata(locale as Locale, t);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const brandName = getBrandName(locale);

  return {
    title: {
      default: metadata.title,
      template: `%s | ${brandName}`,
    },
    description: metadata.description,
    keywords: [
      "credit ledger",
      "veresiye",
      "micro-SME",
      "small business",
      "accounts receivable",
      "customer management",
      "digital ledger",
      "POS",
      "shop management",
      "debt tracking",
      "payment reminders",
    ],
    authors: [{ name: `${brandName} Team` }],
    creator: brandName,
    publisher: brandName,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        tr: "/tr",
        es: "/es",
        hi: "/hi",
        id: "/id",
        ar: "/ar",
        zu: "/zu",
      },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `${baseUrl}/${locale}`,
      siteName: brandName,
      locale: localeToOGLocale[locale] || "en_US",
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${brandName} - Digital Credit Ledger for Micro-SMEs`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: ["/og-image.png"],
      creator: "@globalledger",
      site: "@globalledger",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brandName,
    },
    icons: {
      icon: [
        { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/icon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    category: "Business",
    classification: "Finance/Business Software",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function generateViewport(): Viewport {
  return {
    themeColor: "#3B82F6", // Global Blue from Figma specs
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    // notFound();
    console.warn("Unknown locale in layout render:", locale);
  }

  const messages = await getMessages();

  // RTL support for Arabic (will be added in Phase 10)
  const isRTL = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body
        className={`${manrope.variable} ${inter.variable} ${notoSansArabic.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="dark" storageKey="credit-ledger-theme">
          <NextIntlClientProvider messages={messages}>
            {/* Auth context must be provided via AuthProviderWrapper */}
            <AuthProviderWrapper>{children}</AuthProviderWrapper>
          </NextIntlClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
