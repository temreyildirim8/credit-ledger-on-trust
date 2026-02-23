'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CurrencySelection } from '@/components/onboarding/CurrencySelection';
import { LanguageSelection } from '@/components/onboarding/LanguageSelection';
import { CategorySelection } from '@/components/onboarding/CategorySelection';
import { SuccessScreen } from '@/components/onboarding/SuccessScreen';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    currency: '',
    language: '',
    category: '',
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - redirect to dashboard
      const locale = window.location.pathname.split('/')[1] || 'en';
      router.push(`/${locale}/dashboard`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCurrencySelect = (currency: string) => {
    setFormData((prev) => ({ ...prev, currency }));
  };

  const handleLanguageSelect = (language: string) => {
    setFormData((prev) => ({ ...prev, language }));
  };

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.currency !== '';
      case 2:
        return formData.language !== '';
      case 3:
        return formData.category !== '';
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CurrencySelection
            selectedCurrency={formData.currency}
            onSelect={handleCurrencySelect}
          />
        );
      case 2:
        return (
          <LanguageSelection
            selectedLanguage={formData.language}
            onSelect={handleLanguageSelect}
          />
        );
      case 3:
        return (
          <CategorySelection
            selectedCategory={formData.category}
            onSelect={handleCategorySelect}
          />
        );
      case 4:
        return <SuccessScreen />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('step', { current: currentStep, total: TOTAL_STEPS })}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="border-0 shadow-lg">
        {renderStep()}
      </Card>

      {/* Navigation */}
      {currentStep < TOTAL_STEPS && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            {currentStep === TOTAL_STEPS - 1 ? t('finish') : t('next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Success screen has its own navigation */}
      {currentStep === TOTAL_STEPS && (
        <Button onClick={handleNext} className="w-full">
          {t('success.action') || 'Go to Dashboard'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
