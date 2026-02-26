"use client";

import { Moon, Sun, Lock } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "full" | "compact";
  disabled?: boolean;
}

export function ThemeToggle({ className, variant = "full", disabled = false }: ThemeToggleProps) {
  const { setTheme, actualTheme } = useTheme();

  // Use a sensible default that won't cause hydration mismatch
  const isDark = actualTheme === "dark";
  const isCompact = variant === "compact";

  return (
    <button
      onClick={() => !disabled && setTheme(isDark ? "light" : "dark")}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-lg transition-all duration-200 group",
        "relative overflow-hidden",
        disabled
          ? "text-text-tertiary cursor-not-allowed opacity-50"
          : "text-text-secondary hover:bg-surface-alt hover:text-text",
        isCompact ? "justify-center h-9 w-9 px-0 py-0" : "justify-start px-3 py-2.5 w-full",
        className
      )}
      aria-label={disabled ? "Upgrade for Dark Mode" : isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Hover background - only when not disabled */}
      {!disabled && (
        <div className="absolute inset-0 bg-surface-alt opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Icon with subtle animation */}
      <div className="relative z-10">
        {disabled ? (
          <Lock className="w-5 h-5" />
        ) : isDark ? (
          <Sun className="w-5 h-5 transition-all duration-300 rotate-90 scale-100" />
        ) : (
          <Moon className="w-5 h-5 transition-all duration-300 rotate-0 scale-100" />
        )}
      </div>

      {/* Text label - only show in full variant */}
      {!isCompact && (
        <span className="font-medium text-sm relative z-10">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}

      {/* Subtle glow effect - only when not disabled */}
      {!disabled && (
        <div
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            isDark
              ? "bg-amber-400/5 dark:bg-amber-400/10"
              : "bg-indigo-400/5"
          )}
        />
      )}
    </button>
  );
}
