'use client';

import { useState, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { SubscriptionUpgradeModal } from '@/components/settings/SubscriptionUpgradeModal';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { cn } from '@/lib/utils';

type UpgradePromptVariant = 'inline' | 'card' | 'button' | 'overlay';

interface UpgradePromptProps {
  /** The feature that requires upgrade */
  feature?: string;
  /** Custom message to display */
  message?: string;
  /** Visual variant of the prompt */
  variant?: UpgradePromptVariant;
  /** Size of the prompt */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Children to render behind the overlay (only for 'overlay' variant) */
  children?: ReactNode;
  /** Custom upgrade CTA text */
  ctaText?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Icon to use */
  icon?: 'crown' | 'lock' | 'sparkles';
  /** Called when upgrade is clicked (if provided, won't open modal) */
  onUpgradeClick?: () => void;
}

const iconMap = {
  crown: Crown,
  lock: Lock,
  sparkles: Sparkles,
};

/**
 * A reusable upgrade prompt component that triggers the SubscriptionUpgradeModal.
 * Use this to add upgrade prompts throughout the application.
 *
 * @example
 * // Inline prompt
 * <UpgradePrompt feature="PDF Export" message="Unlock PDF exports with Pro" />
 *
 * @example
 * // Card-style prompt
 * <UpgradePrompt variant="card" feature="Advanced Reports" />
 *
 * @example
 * // Button-only style
 * <UpgradePrompt variant="button" ctaText="Upgrade to Pro" />
 *
 * @example
 * // Overlay style (shows children blurred behind)
 * <UpgradePrompt variant="overlay" feature="Data Export">
 *   <DataTable />
 * </UpgradePrompt>
 */
export function UpgradePrompt({
  feature,
  message,
  variant = 'inline',
  size = 'md',
  className,
  children,
  ctaText,
  showIcon = true,
  icon = 'crown',
  onUpgradeClick,
}: UpgradePromptProps) {
  const t = useTranslations('subscription');
  const tSettings = useTranslations('settings.subscription');
  const { plan } = useSubscription();
  const [modalOpen, setModalOpen] = useState(false);

  // Don't show for paid plans
  const { isPaidPlan } = useSubscription();
  if (isPaidPlan) {
    return children ? <>{children}</> : null;
  }

  const Icon = iconMap[icon];

  const defaultMessage = message || t('upgradePrompt.default', { feature: feature || 'this feature' });
  const defaultCtaText = ctaText || tSettings('upgrade');

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setModalOpen(true);
    }
  };

  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Button-only variant
  if (variant === 'button') {
    return (
      <>
        <Button
          variant="outline"
          size={size === 'lg' ? 'default' : size === 'sm' ? 'sm' : 'default'}
          onClick={handleUpgradeClick}
          className={cn('gap-2', className)}
        >
          {showIcon && <Icon className={iconSizes[size]} />}
          {defaultCtaText}
        </Button>
        {!onUpgradeClick && (
          <SubscriptionUpgradeModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            currentPlan={plan}
          />
        )}
      </>
    );
  }

  // Overlay variant - shows children behind a blur
  if (variant === 'overlay') {
    return (
      <>
        <div className={cn('relative', className)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className={cn('text-center', sizeClasses[size])}>
              {showIcon && (
                <Icon className={cn('text-primary mx-auto mb-2', iconSizes[size === 'sm' ? 'md' : 'lg'])} />
              )}
              <p className="text-muted-foreground mb-2">{defaultMessage}</p>
              <Button size="sm" onClick={handleUpgradeClick}>
                {showIcon && <Icon className={cn('mr-2', iconSizes.sm)} />}
                {defaultCtaText}
              </Button>
            </div>
          </div>
          <div className="opacity-30 pointer-events-none">{children}</div>
        </div>
        {!onUpgradeClick && (
          <SubscriptionUpgradeModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            currentPlan={plan}
          />
        )}
      </>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <>
        <div
          className={cn(
            'bg-primary/5 border border-primary/20 rounded-lg',
            sizeClasses[size],
            className
          )}
        >
          <div className="flex items-start gap-2">
            {showIcon && <Icon className={cn('text-primary flex-shrink-0 mt-0.5', iconSizes[size])} />}
            <div className="flex-1">
              <p className="font-medium text-foreground">{feature || t('upgradePrompt.title')}</p>
              <p className="text-muted-foreground">{defaultMessage}</p>
              <Button
                variant="link"
                size="sm"
                className="px-0 mt-1 h-auto"
                onClick={handleUpgradeClick}
              >
                {defaultCtaText}
              </Button>
            </div>
          </div>
        </div>
        {!onUpgradeClick && (
          <SubscriptionUpgradeModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            currentPlan={plan}
          />
        )}
      </>
    );
  }

  // Inline variant (default)
  return (
    <>
      <div className={cn('flex items-center gap-2', sizeClasses[size], className)}>
        {showIcon && <Icon className={cn('text-primary', iconSizes[size])} />}
        <span className="text-muted-foreground">{defaultMessage}</span>
        <Button
          variant="link"
          size="sm"
          className="px-0 h-auto"
          onClick={handleUpgradeClick}
        >
          {defaultCtaText}
        </Button>
      </div>
      {!onUpgradeClick && (
        <SubscriptionUpgradeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          currentPlan={plan}
        />
      )}
    </>
  );
}

/**
 * Quick upgrade button that can be placed anywhere.
 * Opens the subscription modal when clicked.
 */
export function UpgradeButton({
  className,
  size = 'sm',
  variant = 'outline',
  children,
}: {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'ghost' | 'link';
  children?: ReactNode;
}) {
  const tSettings = useTranslations('settings.subscription');
  const { plan, isPaidPlan } = useSubscription();
  const [modalOpen, setModalOpen] = useState(false);

  if (isPaidPlan) return null;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setModalOpen(true)}
        className={cn('gap-2', className)}
      >
        <Crown className="h-4 w-4" />
        {children || tSettings('upgrade')}
      </Button>
      <SubscriptionUpgradeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        currentPlan={plan}
      />
    </>
  );
}
