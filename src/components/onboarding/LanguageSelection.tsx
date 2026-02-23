'use client';

import { useTranslations } from 'next-intl';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu', flag: '🇿🇦' },
];

type LanguageSelectionProps = {
  selectedLanguage: string;
  onSelect: (language: string) => void;
};

export function LanguageSelection({ selectedLanguage, onSelect }: LanguageSelectionProps) {
  const t = useTranslations('onboarding');

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('language.title')}</CardTitle>
        <CardDescription>{t('language.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => onSelect(language.code)}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:border-primary/50',
                selectedLanguage === language.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <div className="text-left">
                  <div className="font-medium">{language.name}</div>
                  <div className="text-sm text-muted-foreground">{language.native}</div>
                </div>
              </div>
              {selectedLanguage === language.code && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </>
  );
}
