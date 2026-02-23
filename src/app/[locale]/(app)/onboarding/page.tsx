'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CurrencySelection } from '@/components/onboarding/CurrencySelection';
import { LanguageSelection } from '@/components/onboarding/LanguageSelection';
import { CategorySelection } from '@/components/onboarding/CategorySelection';
import { SuccessScreen } from '@/components/onboarding/SuccessScreen';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { userProfilesService } from '@/lib/services/user-profiles.service';
import { toast } from 'sonner';

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    currency: '',
    language: '',
    category: '',
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - save to database and redirect to dashboard
      if (!user?.id) {
        toast.error('Authentication required');
        return;
      }

      setIsSubmitting(true);
      try {
        await userProfilesService.completeOnboarding(user.id, {
          currency: formData.currency,
          language: formData.language,
          industry: formData.category,
        });

        toast.success(t('success.message') || 'Onboarding completed successfully!');

        // Redirect to dashboard
        const locale = formData.language || window.location.pathname.split('/')[1] || 'en';
        router.push(`/${locale}/dashboard`);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        toast.error(t('error') || 'Failed to save your preferences. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
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
        <Button onClick={handleNext} disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving') || 'Saving...'}
            </>
          ) : (
            <>
              {t('success.action') || 'Go to Dashboard'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
