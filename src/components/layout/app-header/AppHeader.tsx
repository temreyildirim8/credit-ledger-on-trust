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
        "sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border",
        "md:hidden", // Only show on mobile
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          {title ? (
            <h1 className="text-lg font-semibold text-text">
              {title}
            </h1>
          ) : (
            <div>
              <p className="text-base font-medium text-text">
                {getGreeting()}, <span className="text-accent">{userName}</span>
              </p>
              {subtitle && (
                <p className="text-xs text-text-secondary mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl hover:bg-surface-alt transition-colors">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
          </button>

          {/* User Avatar */}
          <button className="w-10 h-10 rounded-xl bg-accent text-white font-medium flex items-center justify-center shadow-sm">
            {userName.charAt(0)}
          </button>
        </div>
      </div>
    </header>
  );
}
