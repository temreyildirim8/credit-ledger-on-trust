"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Subscribe to system color scheme changes
function subscribeToMediaQuery(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

// Server snapshot always returns "light"
function getServerSnapshot() {
  return "light" as const;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "credit-ledger-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = localStorage.getItem(storageKey) as Theme;
    return stored || defaultTheme;
  });

  // Use useSyncExternalStore to derive the system theme reactively
  // without calling setState in an effect.
  const systemTheme = useSyncExternalStore(
    subscribeToMediaQuery,
    () =>
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? ("dark" as const)
        : ("light" as const),
    getServerSnapshot,
  );

  const actualTheme: "light" | "dark" =
    theme === "system" ? systemTheme : theme;

  // Apply theme class to document element (external DOM sync — no setState)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(actualTheme);
  }, [actualTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    },
    [storageKey],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
