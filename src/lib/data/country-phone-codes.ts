/**
 * Country phone codes data with mapping to currencies
 * Used for auto-detecting country code based on user's currency preference
 */

export interface CountryPhoneCode {
  /** ISO 3166-1 alpha-2 country code */
  code: string;
  /** Country name in English */
  name: string;
  /** International dialing code with + prefix */
  dialCode: string;
  /** Flag emoji */
  flag: string;
  /** Associated currency code (ISO 4217) */
  currency: string;
  /** Priority for search results (higher = more likely to show first) */
  priority?: number;
}

/**
 * List of country phone codes for supported markets
 * Priority order based on target markets: TR, ID, NG, EG, ZA, ES/LatAm
 */
export const COUNTRY_PHONE_CODES: CountryPhoneCode[] = [
  // Primary target markets (higher priority)
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', currency: 'TRY', priority: 100 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', currency: 'IDR', priority: 100 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', currency: 'NGN', priority: 100 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', currency: 'EGP', priority: 100 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', currency: 'ZAR', priority: 100 },

  // Secondary markets
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', currency: 'EUR', priority: 90 },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', currency: 'INR', priority: 90 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', currency: 'USD', priority: 80 },

  // Other EUR countries
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', currency: 'EUR', priority: 70 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', currency: 'EUR', priority: 70 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', currency: 'EUR', priority: 70 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', currency: 'EUR', priority: 70 },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', currency: 'EUR', priority: 70 },

  // Latin America (Spanish speaking)
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', currency: 'MXN', priority: 85 },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', currency: 'ARS', priority: 85 },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', currency: 'COP', priority: 85 },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', currency: 'CLP', priority: 85 },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', currency: 'PEN', priority: 85 },

  // Other common countries
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', currency: 'GBP', priority: 75 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', currency: 'BRL', priority: 75 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', currency: 'CNY', priority: 75 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', currency: 'JPY', priority: 75 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', currency: 'KRW', priority: 75 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', currency: 'AUD', priority: 70 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', currency: 'CAD', priority: 70 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', currency: 'RUB', priority: 70 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', currency: 'SAR', priority: 70 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', currency: 'AED', priority: 70 },
];

/**
 * Get country phone code by currency
 * Returns the first matching country for the given currency
 */
export function getCountryByCurrency(currency: string): CountryPhoneCode | undefined {
  return COUNTRY_PHONE_CODES.find(c => c.currency === currency);
}

/**
 * Get country phone code by ISO code
 */
export function getCountryByCode(code: string): CountryPhoneCode | undefined {
  return COUNTRY_PHONE_CODES.find(c => c.code === code.toUpperCase());
}

/**
 * Get country phone code by dial code
 */
export function getCountryByDialCode(dialCode: string): CountryPhoneCode | undefined {
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRY_PHONE_CODES.find(c => c.dialCode === normalized);
}

/**
 * Search countries by name, code, or dial code
 * Results are sorted by priority (highest first)
 */
export function searchCountries(query: string): CountryPhoneCode[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [...COUNTRY_PHONE_CODES].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  return COUNTRY_PHONE_CODES
    .filter(country => {
      const nameMatch = country.name.toLowerCase().includes(normalizedQuery);
      const codeMatch = country.code.toLowerCase().includes(normalizedQuery);
      const dialMatch = country.dialCode.includes(normalizedQuery);
      return nameMatch || codeMatch || dialMatch;
    })
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/**
 * Parse a phone number to extract country code and local number
 * Returns null if no matching country code is found
 */
export function parsePhoneNumber(phone: string): { country: CountryPhoneCode; localNumber: string } | null {
  const trimmed = phone.trim();

  // Try to match against known dial codes (longest first)
  const sortedByLength = [...COUNTRY_PHONE_CODES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  for (const country of sortedByLength) {
    if (trimmed.startsWith(country.dialCode)) {
      const localNumber = trimmed.slice(country.dialCode.length).trim();
      return { country, localNumber };
    }
  }

  return null;
}

/**
 * Format phone number with country code
 * If the phone already has a country code, returns as-is
 * If country is provided, prepends the country's dial code
 */
export function formatPhoneNumber(phone: string, country?: CountryPhoneCode): string {
  const trimmed = phone.trim();

  // Already has a country code
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  // Prepend country code if provided
  if (country) {
    // Remove leading zeros from local number
    const localNumber = trimmed.replace(/^0+/, '');
    return `${country.dialCode}${localNumber}`;
  }

  return trimmed;
}

/**
 * Default country code for new customers (Turkey)
 */
export const DEFAULT_COUNTRY: CountryPhoneCode = COUNTRY_PHONE_CODES[0];
