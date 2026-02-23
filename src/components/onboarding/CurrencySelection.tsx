'use client';

import { useTranslations } from 'next-intl';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const CURRENCIES = [
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
];

type CurrencySelectionProps = {
  selectedCurrency: string;
  onSelect: (currency: string) => void;
};

export function CurrencySelection({ selectedCurrency, onSelect }: CurrencySelectionProps) {
  const t = useTranslations('onboarding');

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('currency.title')}</CardTitle>
        <CardDescription>{t('currency.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => onSelect(currency.code)}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary/50',
                selectedCurrency === currency.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              <span className="text-2xl mb-1">{currency.flag}</span>
              <span className="text-lg font-semibold">{currency.symbol}</span>
              <span className="text-xs text-muted-foreground">{currency.code}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </>
  );
}
