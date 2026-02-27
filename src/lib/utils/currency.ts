/**
 * Maps currency codes to their BCP 47 locale strings for Intl.NumberFormat
 */
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  TRY: "tr-TR",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  IDR: "id-ID",
  INR: "hi-IN",
  SAR: "ar-SA",
  AED: "ar-AE",
  AZN: "az-AZ",
  UAH: "uk-UA",
};

/**
 * Resolves a BCP 47 locale string for a given currency code.
 * Falls back to 'en-US' for unknown currencies.
 */
export function getCurrencyLocale(currency: string): string {
  return CURRENCY_LOCALE_MAP[currency] ?? "en-US";
}

/**
 * Formats a numeric amount as a currency string.
 * @param amount - The numeric value to format
 * @param currency - ISO 4217 currency code (e.g. 'TRY', 'USD'). Defaults to 'USD'.
 * @param decimalPlaces - Number of decimal places to show. Defaults to 0.
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  decimalPlaces = 0,
): string {
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: "currency",
    currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);
}
