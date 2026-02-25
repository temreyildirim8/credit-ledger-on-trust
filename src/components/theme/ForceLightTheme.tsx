"use client";

import { useEffect } from "react";
import { useTheme } from "./theme-provider";

interface ForceLightThemeProps {
  children: React.ReactNode;
}

/**
 * Forces light theme on mounted pages (e.g., marketing pages)
 * Restores original theme preference on unmount
 */
export function ForceLightTheme({ children }: ForceLightThemeProps) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Store the current theme preference
    const savedTheme = theme;

    // Force light theme
    if (theme !== "light") {
      setTheme("light");
    }

    // Restore original theme on unmount
    return () => {
      if (savedTheme !== "light") {
        setTheme(savedTheme);
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  return <>{children}</>;
}
