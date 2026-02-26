'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  COUNTRY_PHONE_CODES,
  CountryPhoneCode,
  parsePhoneNumber,
  formatPhoneNumber,
} from '@/lib/data/country-phone-codes';

export interface PhoneInputValue {
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  /** Local phone number without country code */
  localNumber: string;
  /** Full formatted phone number with country code */
  formatted: string;
}

interface PhoneInputProps {
  /** Current value as full phone number with country code */
  value?: string;
  /** Callback when phone number changes */
  onChange: (value: PhoneInputValue) => void;
  /** Callback when input loses focus */
  onBlur?: () => void;
  /** Default country code to use (ISO 3166-1 alpha-2) */
  defaultCountryCode?: string;
  /** Country code to auto-detect from user's currency */
  currencyCode?: string;
  /** Placeholder for local number input */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input has an error */
  error?: boolean;
  /** Additional class names */
  className?: string;
  /** ID for the input element */
  id?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

/**
 * Get all countries for dropdown (sorted by priority)
 */
function getAllCountries(): CountryPhoneCode[] {
  return [...COUNTRY_PHONE_CODES].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/**
 * Phone input component with country code selector
 * Supports auto-detection from user's currency preference
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  defaultCountryCode,
  currencyCode,
  placeholder = '5XX XXX XX XX',
  disabled = false,
  error = false,
  className,
  id,
  ariaLabel,
}: PhoneInputProps) {
  const allCountries = React.useMemo(() => getAllCountries(), []);

  const [selectedCountry, setSelectedCountry] = React.useState<CountryPhoneCode | null>(() => {
    // Priority: 1. Parse from value, 2. Currency mapping, 3. Default
    if (value) {
      const parsed = parsePhoneNumber(value);
      if (parsed) return parsed.country;
    }

    // Try to get from currency
    if (currencyCode) {
      const currencyCountry = COUNTRY_PHONE_CODES.find(c => c.currency === currencyCode);
      if (currencyCountry) return currencyCountry;
    }

    // Try default country code
    if (defaultCountryCode) {
      const defaultCountry = COUNTRY_PHONE_CODES.find(c => c.code === defaultCountryCode);
      if (defaultCountry) return defaultCountry;
    }

    // Fallback to Turkey
    return COUNTRY_PHONE_CODES[0];
  });

  const [localNumber, setLocalNumber] = React.useState<string>(() => {
    if (value) {
      const parsed = parsePhoneNumber(value);
      return parsed?.localNumber ?? value.replace(/^\+\d+/, '').trim();
    }
    return '';
  });

  // Handle local number change
  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Only allow digits, spaces, dashes, and parentheses
    const sanitized = newValue.replace(/[^\d\s\-()]/g, '');
    setLocalNumber(sanitized);

    // Notify parent
    const formatted = selectedCountry
      ? formatPhoneNumber(sanitized, selectedCountry)
      : sanitized;

    onChange({
      countryCode: selectedCountry?.code ?? '',
      localNumber: sanitized,
      formatted,
    });
  };

  // Handle country selection change
  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRY_PHONE_CODES.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);

      // Notify parent with new country code
      const formatted = formatPhoneNumber(localNumber, country);
      onChange({
        countryCode: country.code,
        localNumber,
        formatted,
      });
    }
  };

  // Track previous external value to avoid unnecessary updates
  const prevValueRef = React.useRef(value);

  // Sync with external value changes
  React.useEffect(() => {
    // Only sync if the external value actually changed
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;

      if (value) {
        const currentFormatted = formatPhoneNumber(localNumber, selectedCountry ?? undefined);
        if (value !== currentFormatted) {
          const parsed = parsePhoneNumber(value);
          if (parsed) {
            setSelectedCountry(parsed.country);
            setLocalNumber(parsed.localNumber);
          } else {
            // Value doesn't have a recognizable country code
            setLocalNumber(value);
          }
        }
      }
    }
  }, [value, localNumber, selectedCountry]);

  return (
    <div className={cn('flex gap-2', className)}>
      {/* Country Code Selector */}
      <Select
        value={selectedCountry?.code}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-[110px] shrink-0"
          aria-label={ariaLabel || 'Select country code'}
        >
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span className="text-base">{selectedCountry?.flag}</span>
              <span className="text-xs text-muted-foreground">{selectedCountry?.dialCode}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {allCountries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span className="flex-1">{country.name}</span>
                <span className="text-xs text-muted-foreground">{country.dialCode}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Local Number Input */}
      <Input
        id={id}
        type="tel"
        value={localNumber}
        onChange={handleLocalNumberChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex-1',
          error && 'border-destructive focus-visible:ring-destructive'
        )}
        aria-label="Phone number"
      />
    </div>
  );
}

export { COUNTRY_PHONE_CODES } from '@/lib/data/country-phone-codes';
export type { CountryPhoneCode } from '@/lib/data/country-phone-codes';
