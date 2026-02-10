import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing, type Locale } from "@/routing";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import "../globals.css";

// Global Ledger font pairing - Plus Jakarta Sans for display, Inter for body/numbers
const plusJakarta = Plus_Jakarta_Sans({
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    // notFound();
    console.warn("Unknown locale in layout:", locale);
  }
  // Get messages for the locale
  const messages = await getMessages({ locale });
  const t = (key: string) => {
    const keys = key.split(".");
    let value: any = messages;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  // Get industry from environment or default to 'general'
  const industry = (process.env.NEXT_PUBLIC_INDUSTRY ||
    "general") as keyof typeof industryMetadata;
  const getMetadata = industryMetadata[industry] || industryMetadata.general;
  const metadata = getMetadata(locale as Locale, t);

  return {
    title: metadata.title,
    description: metadata.description,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    ),
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
      locale: locale,
      type: "website",
    },
    manifest: "/manifest.json",
    themeColor: "#2D8E4A",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Global Ledger",
    },
    icons: {
      icon: "/icons/icon.svg",
      apple: "/icons/icon.svg",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${inter.variable} antialiased`}
      >
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <PWAProvider />
            {children}
          </NextIntlClientProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
