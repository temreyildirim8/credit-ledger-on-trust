"use client";

import { Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * App header component for authenticated pages
 * Shows greeting, notifications, and user avatar
 */
export function AppHeader({
  title,
  subtitle,
  className,
}: AppHeaderProps) {
  // Get user name from auth context or use default
  const userName = "Ahmed"; // TODO: Get from auth context

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--color-border)]",
        "md:hidden", // Only show on mobile
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          {title ? (
            <h1 className="text-lg font-semibold text-[var(--color-text)]">
              {title}
            </h1>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {getGreeting()}, {userName}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors">
            <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-error)] rounded-full" />
          </button>

          {/* User Avatar */}
          <button className="w-9 h-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-medium">
            {userName.charAt(0)}
          </button>
        </div>
      </div>
    </header>
  );
}
