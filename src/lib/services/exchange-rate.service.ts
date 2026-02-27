/**
 * Exchange Rate Service
 * Uses Frankfurter API (free, no API key required)
 * European Central Bank rates, updated daily
 * API Docs: https://www.frankfurter.app/
 */

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const API_BASE = "https://api.frankfurter.app";

export interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
  base: string;
}

// In-memory cache for server-side
let serverCache: ExchangeRateCache | null = null;

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { value: "TRY", label: "Türk Lirası (₺)", symbol: "₺" },
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "GBP", label: "British Pound (£)", symbol: "£" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["value"];

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.value === currency);
  return found?.symbol || currency;
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = "en-US",
): string {
  const symbol = getCurrencySymbol(currency);

  // For currencies without symbol support, use code
  if (symbol === currency) {
    return `${currency} ${amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Exchange rate service for currency conversion
 * Uses Frankfurter API with caching
 */
export const exchangeRateService = {
  /**
   * Get exchange rates for a base currency
   * Uses in-memory cache to minimize API calls
   */
  async getRates(
    baseCurrency: string = "TRY",
  ): Promise<Record<string, number>> {
    // Check server cache
    if (
      serverCache &&
      Date.now() - serverCache.timestamp < CACHE_DURATION &&
      serverCache.base === baseCurrency
    ) {
      return serverCache.rates;
    }

    try {
      // Fetch from Frankfurter API
      const response = await fetch(`${API_BASE}/latest?from=${baseCurrency}`);

      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data = await response.json();

      // Update server cache
      serverCache = {
        rates: data.rates,
        timestamp: Date.now(),
        base: baseCurrency,
      };

      return data.rates;
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);

      // Return fallback rates if API fails
      // These are approximate rates and should be updated periodically
      return this.getFallbackRates(baseCurrency);
    }
  },

  /**
   * Get fallback rates in case API is unavailable
   * These are approximate rates as of 2026-02-27
   */
  getFallbackRates(baseCurrency: string): Record<string, number> {
    const fallbackRates: Record<string, Record<string, number>> = {
      TRY: {
        USD: 0.028,
        EUR: 0.026,
        GBP: 0.022,
      },
      USD: {
        TRY: 35.71,
        EUR: 0.92,
        GBP: 0.79,
      },
      EUR: {
        TRY: 38.46,
        USD: 1.09,
        GBP: 0.86,
      },
      GBP: {
        TRY: 45.45,
        USD: 1.27,
        EUR: 1.16,
      },
    };

    return fallbackRates[baseCurrency] || { USD: 1, EUR: 1, GBP: 1 };
  },

  /**
   * Convert an amount from one currency to another
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      console.warn(`No rate found for ${fromCurrency} -> ${toCurrency}`);
      return amount;
    }

    return amount * rate;
  },

  /**
   * Convert an amount to USD equivalent
   * Common use case for displaying USD alongside local currency
   */
  async convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    return this.convert(amount, fromCurrency, "USD");
  },

  /**
   * Get the exchange rate between two currencies
   */
  async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rates = await this.getRates(fromCurrency);
    return rates[toCurrency] || 1;
  },

  /**
   * Clear the cache (useful for testing or force refresh)
   */
  clearCache(): void {
    serverCache = null;
  },

  /**
   * Get cache status (useful for debugging)
   */
  getCacheStatus(): {
    cached: boolean;
    age: number | null;
    base: string | null;
  } {
    if (!serverCache) {
      return { cached: false, age: null, base: null };
    }

    return {
      cached: true,
      age: Date.now() - serverCache.timestamp,
      base: serverCache.base,
    };
  },
};

/**
 * Client-side hook for exchange rates
 * Uses React state for client-side caching
 */
export function createClientExchangeRateService() {
  let clientCache: ExchangeRateCache | null = null;

  return {
    async getRates(
      baseCurrency: string = "TRY",
    ): Promise<Record<string, number>> {
      // Check client cache
      if (
        clientCache &&
        Date.now() - clientCache.timestamp < CACHE_DURATION &&
        clientCache.base === baseCurrency
      ) {
        return clientCache.rates;
      }

      try {
        const response = await fetch(`${API_BASE}/latest?from=${baseCurrency}`);

        if (!response.ok) {
          throw new Error(`Exchange rate API error: ${response.status}`);
        }

        const data = await response.json();

        // Update client cache
        clientCache = {
          rates: data.rates,
          timestamp: Date.now(),
          base: baseCurrency,
        };

        return data.rates;
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        return exchangeRateService.getFallbackRates(baseCurrency);
      }
    },

    async convertToUSD(amount: number, fromCurrency: string): Promise<number> {
      if (fromCurrency === "USD") return amount;

      const rates = await this.getRates(fromCurrency);
      return amount * (rates.USD || 1);
    },

    clearCache(): void {
      clientCache = null;
    },
  };
}
