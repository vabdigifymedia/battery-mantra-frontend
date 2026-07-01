import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isBrowser } from "@/lib/utils/env";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
};

const KEY = "bm.theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolve(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (!isBrowser) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyClass(mode: "light" | "dark") {
  if (!isBrowser) return;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

export function ThemeProvider({ children, defaultTheme = "light" }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (!isBrowser) return;
    const stored = (window.localStorage.getItem(KEY) as Theme | null) ?? defaultTheme;
    setThemeState(stored);
  }, [defaultTheme]);

  useEffect(() => {
    const mode = resolve(theme);
    setResolved(mode);
    applyClass(mode);
    if (isBrowser) window.localStorage.setItem(KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!isBrowser || theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const mode = mql.matches ? "dark" : "light";
      setResolved(mode);
      applyClass(mode);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
