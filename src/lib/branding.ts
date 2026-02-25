/**
 * Localized branding configuration
 *
 * Each locale has a culturally relevant brand name:
 * - en (Global): Ledgerly - Modern, friendly take on "ledger"
 * - tr (Turkey): Veresiye-X - "Veresiye" = credit on account, X for modern tech feel
 * - es (Latin America/Spain): Fiado-X - "Fiado" = credit sales in small shops
 * - id (Indonesia): Hutang-Ku - "Hutang" = debt, "-Ku" = my (My Debt)
 * - hi (India): Udhar-X - "Udhar" = credit/debt in Hindi
 * - ar (MENA): Dayn-X - "Dayn" = debt in Arabic
 * - zu (South Africa): Mali-X - "Mali" = money in Zulu
 */

export const BRAND_NAMES: Record<string, string> = {
  en: "Ledgerly",
  tr: "Veresiye-X",
  es: "Fiado-X",
  id: "Hutang-Ku",
  hi: "Udhar-X",
  ar: "Dayn-X",
  zu: "Mali-X",
} as const;

export const DEFAULT_BRAND = "Ledgerly";

/**
 * Get the brand name for a specific locale
 */
export function getBrandName(locale: string): string {
  return BRAND_NAMES[locale] ?? DEFAULT_BRAND;
}

/**
 * Get all brand names for sitemap/SEO purposes
 */
export function getAllBrandNames(): Record<string, string> {
  return { ...BRAND_NAMES };
}

/**
 * Brand metadata for each locale
 */
export const BRAND_METADATA: Record<
  string,
  {
    name: string;
    tagline: string;
    description: string;
    supportEmail: string;
  }
> = {
  en: {
    name: "Ledgerly",
    tagline: "Track credit. Build trust.",
    description:
      "The simple way to manage customer credit for your small business.",
    supportEmail: "support@ledgerly.app",
  },
  tr: {
    name: "Veresiye-X",
    tagline: "Veresiyeyi takip et. Güveni inşa et.",
    description:
      "Küçük işletmeniz için müşteri veresiyesini yönetmenin basit yolu.",
    supportEmail: "destek@veresiye-x.app",
  },
  es: {
    name: "Fiado-X",
    tagline: "Controla el fiado. Construye confianza.",
    description:
      "La forma simple de gestionar el crédito de tus clientes para tu pequeño negocio.",
    supportEmail: "soporte@fiado-x.app",
  },
  id: {
    name: "Hutang-Ku",
    tagline: "Catat hutang. Bangun kepercayaan.",
    description:
      "Cara sederhana mengelola piutang pelanggan untuk usaha kecil Anda.",
    supportEmail: "dukungan@hutang-ku.app",
  },
  hi: {
    name: "Udhar-X",
    tagline: "उधार ट्रैक करें। विश्वास बनाएं।",
    description:
      "अपने छोटे व्यवसाय के लिए ग्राहक क्रेडिट प्रबंधित करने का आसान तरीका।",
    supportEmail: "support@udhar-x.app",
  },
  ar: {
    name: "Dayn-X",
    tagline: "تتبع الدين. بناء الثقة.",
    description: "الطريقة البسيطة لإدارة ائتمان العملاء لأعمالك الصغيرة.",
    supportEmail: "support@dayn-x.app",
  },
  zu: {
    name: "Mali-X",
    tagline: "Landa imali. Akha isithembiso.",
    description:
      "Indlela elula yokuphatha ukuholiwe kwezikhashana zakho ngebhizinisi lakho elincane.",
    supportEmail: "support@mali-x.app",
  },
} as const;

/**
 * Get brand metadata for a specific locale
 */
export function getBrandMetadata(locale: string) {
  return (
    BRAND_METADATA[locale] ?? {
      name: DEFAULT_BRAND,
      tagline: "Track credit. Build trust.",
      description:
        "The simple way to manage customer credit for your small business.",
      supportEmail: "support@ledgerly.app",
    }
  );
}
