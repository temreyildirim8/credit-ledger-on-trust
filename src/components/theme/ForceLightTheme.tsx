"use client";

import { useEffect, useRef } from "react";
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
  const initialThemeRef = useRef<string | null>(null);

  useEffect(() => {
    // Store the current theme preference on first mount
    if (initialThemeRef.current === null) {
      initialThemeRef.current = theme;
    }

    // Force light theme
    if (theme !== "light") {
      setTheme("light");
    }

    // Restore original theme on unmount
    return () => {
      if (initialThemeRef.current && initialThemeRef.current !== "light") {
        setTheme(initialThemeRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  return <>{children}</>;
}
