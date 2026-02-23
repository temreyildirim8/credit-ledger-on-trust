"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  spotlightPadding?: number;
}

const TOUR_STORAGE_KEY = "global-ledger-tour-completed";

export function QuickTour() {
  const t = useTranslations("quickTour");
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  // Tour steps configuration
  const steps: TourStep[] = [
    {
      id: "sidebar",
      target: "[data-tour='sidebar-nav']",
      title: t("steps.sidebar.title"),
      description: t("steps.sidebar.description"),
      position: "right",
      spotlightPadding: 8,
    },
    {
      id: "quick-add",
      target: "[data-tour='quick-add-button']",
      title: t("steps.quickAdd.title"),
      description: t("steps.quickAdd.description"),
      position: "bottom",
      spotlightPadding: 8,
    },
    {
      id: "stats",
      target: "[data-tour='quick-stats']",
      title: t("steps.stats.title"),
      description: t("steps.stats.description"),
      position: "bottom",
      spotlightPadding: 12,
    },
    {
      id: "actions",
      target: "[data-tour='quick-actions']",
      title: t("steps.actions.title"),
      description: t("steps.actions.description"),
      position: "bottom",
      spotlightPadding: 12,
    },
    {
      id: "activity",
      target: "[data-tour='recent-activity']",
      title: t("steps.activity.title"),
      description: t("steps.activity.description"),
      position: "top",
      spotlightPadding: 12,
    },
  ];

  // Check if tour should start
  useEffect(() => {
    setMounted(true);

    const checkTour = () => {
      const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
      const isDesktop = window.innerWidth >= 768;

      // Only show tour on desktop for first-time users
      if (!tourCompleted && isDesktop) {
        // Delay start to allow page to render
        setTimeout(() => {
          setIsActive(true);
        }, 1500);
      }
    };

    checkTour();

    // Listen for manual tour trigger
    const handleStartTour = () => {
      setCurrentStep(0);
      setIsActive(true);
    };

    window.addEventListener("start-quick-tour", handleStartTour);
    return () => {
      window.removeEventListener("start-quick-tour", handleStartTour);
    };
  }, []);

  // Update target position when step changes
  useEffect(() => {
    if (!isActive) return;

    const updateTargetRect = () => {
      const step = steps[currentStep];
      if (!step) return;

      const target = document.querySelector(step.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    updateTargetRect();

    // Update on resize
    window.addEventListener("resize", updateTargetRect);
    return () => window.removeEventListener("resize", updateTargetRect);
  }, [isActive, currentStep, steps]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    window.dispatchEvent(new CustomEvent("quick-tour-completed"));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep, steps.length, completeTour]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          handleNext();
          break;
        case "ArrowLeft":
          handlePrevious();
          break;
        case "Escape":
          handleSkip();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, handleNext, handlePrevious, handleSkip]);

  if (!mounted || !isActive || !targetRect) return null;

  const step = steps[currentStep];
  const padding = step.spotlightPadding || 8;

  // Calculate spotlight position
  const spotlightStyle = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  // Calculate tooltip position
  const getTooltipStyle = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const gap = 12;

    switch (step.position) {
      case "top":
        return {
          top: targetRect.top - tooltipHeight - gap,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "bottom":
        return {
          top: targetRect.bottom + gap,
          left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - gap,
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + gap,
        };
      default:
        return {};
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with cutout for spotlight */}
      <div className="absolute inset-0">
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black/60 transition-opacity"
          onClick={handleSkip}
        />

        {/* Spotlight cutout using box-shadow */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            ...spotlightStyle,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        className={cn(
          "absolute w-80 bg-surface rounded-xl shadow-lg border border-border p-5",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-xs font-semibold">
              {currentStep + 1}
            </span>
            <h3 className="font-semibold text-text">{step.title}</h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-text-secondary hover:text-text transition-colors"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          {step.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  index === currentStep
                    ? "bg-accent"
                    : index < currentStep
                      ? "bg-accent/50"
                      : "bg-border"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                className="text-text-secondary"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t("back")}
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? t("finish") : t("next")}
              {currentStep < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Hook to manually start the tour
export function useStartTour() {
  return () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("start-quick-tour"));
  };
}

// Hook to check if tour has been completed
export function useTourCompleted() {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(localStorage.getItem(TOUR_STORAGE_KEY) === "true");
  }, []);

  return completed;
}
