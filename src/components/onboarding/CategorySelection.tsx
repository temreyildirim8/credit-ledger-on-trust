'use client';

import { useTranslations } from 'next-intl';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const CATEGORIES = [
  { code: 'bakkal', icon: '🏪', translationKey: 'bakkal' },
  { code: 'kirana', icon: '🏪', translationKey: 'kirana' },
  { code: 'warung', icon: '🏪', translationKey: 'warung' },
  { code: 'spaza', icon: '🏪', translationKey: 'spaza' },
  { code: 'kiosk', icon: '🏪', translationKey: 'kiosk' },
  { code: 'restaurant', icon: '🍽️', translationKey: 'restaurant' },
  { code: 'retail', icon: '🛒', translationKey: 'retail' },
  { code: 'wholesale', icon: '📦', translationKey: 'wholesale' },
  { code: 'services', icon: '🔧', translationKey: 'services' },
  { code: 'other', icon: '📋', translationKey: 'other' },
];

type CategorySelectionProps = {
  selectedCategory: string;
  onSelect: (category: string) => void;
};

export function CategorySelection({ selectedCategory, onSelect }: CategorySelectionProps) {
  const t = useTranslations('onboarding.categories');

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('category.title')}</CardTitle>
        <CardDescription>{t('category.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((category) => (
            <button
              key={category.code}
              type="button"
              onClick={() => onSelect(category.code)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-primary/50 text-left',
                selectedCategory === category.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              <span className="text-2xl">{category.icon}</span>
              <span className="text-sm font-medium flex-1">
                {t(category.translationKey)}
              </span>
              {selectedCategory === category.code && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </>
  );
}
