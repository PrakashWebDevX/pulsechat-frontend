"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
type Wallpaper = "default" | "pattern" | "gradient" | "solid-dark" | "solid-light" | "nature" | "abstract";

interface ThemeContextType {
  theme: Theme;
  wallpaper: Wallpaper;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setWallpaper: (w: Wallpaper) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  wallpaper: "default",
  toggleTheme: () => {},
  setTheme: () => {},
  setWallpaper: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [wallpaper, setWallpaperState] = useState<Wallpaper>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem("pulsechat-theme") as Theme | null;
    const savedWallpaper = localStorage.getItem("pulsechat-wallpaper") as Wallpaper | null;
    if (savedTheme) setThemeState(savedTheme);
    if (savedWallpaper) setWallpaperState(savedWallpaper);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pulsechat-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pulsechat-wallpaper", wallpaper);
  }, [wallpaper, mounted]);

  const toggleTheme = () => setThemeState((t) => t === "dark" ? "light" : "dark");
  const setTheme = (t: Theme) => setThemeState(t);
  const setWallpaper = (w: Wallpaper) => setWallpaperState(w);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, wallpaper, toggleTheme, setTheme, setWallpaper }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
