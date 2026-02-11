"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, actualTheme } = useTheme();

  // Use a sensible default that won't cause hydration mismatch
  const isDark = actualTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-all duration-200 group",
        "text-text-secondary hover:bg-surface-alt hover:text-text",
        "relative overflow-hidden",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Hover background */}
      <div className="absolute inset-0 bg-surface-alt opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Icon with subtle animation */}
      <div className="relative z-10">
        {isDark ? (
          <Sun className="w-5 h-5 transition-all duration-300 rotate-90 scale-100" />
        ) : (
          <Moon className="w-5 h-5 transition-all duration-300 rotate-0 scale-100" />
        )}
      </div>

      {/* Text label */}
      <span className="font-medium text-sm relative z-10">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>

      {/* Subtle glow effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          isDark
            ? "bg-amber-400/5 dark:bg-amber-400/10"
            : "bg-indigo-400/5"
        )}
      />
    </button>
  );
}
