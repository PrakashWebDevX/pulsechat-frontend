"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AccentColor = "green" | "blue" | "purple" | "pink" | "orange" | "red";
export type WallpaperType = "none" | "gradient1" | "gradient2" | "gradient3" | "dots" | "waves" | "custom";

interface AppearanceConfig {
  accent: AccentColor;
  wallpaper: WallpaperType;
  customWallpaper: string;
  fontSize: "sm" | "md" | "lg";
  bubbleStyle: "modern" | "classic" | "minimal";
}

const ACCENTS: Record<AccentColor, { primary: string; dark: string }> = {
  green:  { primary: "#22c55e", dark: "#16a34a" },
  blue:   { primary: "#3b82f6", dark: "#2563eb" },
  purple: { primary: "#a855f7", dark: "#9333ea" },
  pink:   { primary: "#ec4899", dark: "#db2777" },
  orange: { primary: "#f97316", dark: "#ea580c" },
  red:    { primary: "#ef4444", dark: "#dc2626" },
};

const WALLPAPERS: Record<WallpaperType, string> = {
  none: "transparent",
  gradient1: "linear-gradient(135deg, #0f1117 0%, #1a2540 50%, #0f1117 100%)",
  gradient2: "linear-gradient(135deg, #0d1117 0%, #1a0a2e 50%, #0d1117 100%)",
  gradient3: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)",
  dots: "radial-gradient(circle, #2a3040 1px, transparent 1px)",
  waves: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)",
  custom: "",
};

const DEFAULT_CONFIG: AppearanceConfig = {
  accent: "green",
  wallpaper: "none",
  customWallpaper: "",
  fontSize: "md",
  bubbleStyle: "modern",
};

const AppearanceContext = createContext<{
  config: AppearanceConfig;
  setAccent: (a: AccentColor) => void;
  setWallpaper: (w: WallpaperType, custom?: string) => void;
  setFontSize: (f: "sm" | "md" | "lg") => void;
  setBubbleStyle: (b: "modern" | "classic" | "minimal") => void;
  getWallpaperStyle: () => React.CSSProperties;
}>({
  config: DEFAULT_CONFIG,
  setAccent: () => {},
  setWallpaper: () => {},
  setFontSize: () => {},
  setBubbleStyle: () => {},
  getWallpaperStyle: () => ({}),
});

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppearanceConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pc_appearance");
      if (saved) setConfig(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (updates: Partial<AppearanceConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    localStorage.setItem("pc_appearance", JSON.stringify(next));

    // Apply accent color CSS variables
    const accent = ACCENTS[next.accent];
    document.documentElement.style.setProperty("--brand", accent.primary);
    document.documentElement.style.setProperty("--brand-dark", accent.dark);
    document.documentElement.style.setProperty("--bubble-mine", accent.dark);
  };

  useEffect(() => {
    const accent = ACCENTS[config.accent];
    document.documentElement.style.setProperty("--brand", accent.primary);
    document.documentElement.style.setProperty("--brand-dark", accent.dark);
    document.documentElement.style.setProperty("--bubble-mine", accent.dark);
  }, [config.accent]);

  const getWallpaperStyle = (): React.CSSProperties => {
    if (config.wallpaper === "custom" && config.customWallpaper) {
      return { backgroundImage: `url(${config.customWallpaper})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    if (config.wallpaper === "dots") {
      return { backgroundImage: WALLPAPERS.dots, backgroundSize: "20px 20px" };
    }
    return { background: WALLPAPERS[config.wallpaper] };
  };

  return (
    <AppearanceContext.Provider value={{
      config,
      setAccent: (a) => save({ accent: a }),
      setWallpaper: (w, custom) => save({ wallpaper: w, customWallpaper: custom || config.customWallpaper }),
      setFontSize: (f) => save({ fontSize: f }),
      setBubbleStyle: (b) => save({ bubbleStyle: b }),
      getWallpaperStyle,
    }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export const useAppearance = () => useContext(AppearanceContext);
export { ACCENTS, WALLPAPERS };
