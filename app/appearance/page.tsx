"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useAppearance, AccentColor, WallpaperType, ACCENTS, WALLPAPERS } from "@/lib/AppearanceContext";
import { useTheme } from "@/lib/ThemeContext";
import { toggleSound, isSoundEnabled } from "@/lib/sounds";
import { useState, useEffect } from "react";

const ACCENT_LABELS: Record<AccentColor, string> = { green: "🌿 Mint", blue: "💙 Ocean", purple: "💜 Violet", pink: "🌸 Rose", orange: "🍊 Sunset", red: "❤️ Ruby" };
const WALLPAPER_LABELS: Record<WallpaperType, string> = { none: "None", gradient1: "Midnight", gradient2: "Cosmic", gradient3: "Deep Sea", dots: "Dots", waves: "Waves", custom: "Custom" };

export default function AppearancePage() {
  const router = useRouter();
  const { config, setAccent, setWallpaper, setFontSize, setBubbleStyle, getWallpaperStyle } = useAppearance();
  const { theme, toggleTheme } = useTheme();
  const [soundOn, setSoundOn] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSoundOn(isSoundEnabled()); }, []);

  const handleSoundToggle = () => { const next = toggleSound(); setSoundOn(next); };

  const handleCustomWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setWallpaper("custom", reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="h-16 border-b border-surface-border bg-surface-card flex items-center gap-4 px-4">
        <button onClick={() => router.push("/chat")} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-white font-semibold">Appearance</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Preview */}
        <div className="rounded-2xl overflow-hidden border border-surface-border h-40 relative" style={getWallpaperStyle()}>
          <div className="absolute inset-0 flex flex-col justify-end p-4 gap-2">
            <div className="flex justify-start">
              <div className="bg-surface-raised rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-100 max-w-[60%]">Hey! How are you? 👋</div>
            </div>
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white max-w-[60%]" style={{ backgroundColor: "var(--bubble-mine)" }}>I'm great, thanks! 😊</div>
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Accent Color</h3>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ACCENTS) as AccentColor[]).map((accent) => (
              <button key={accent} onClick={() => setAccent(accent)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${config.accent === accent ? "border-white/30 bg-white/5" : "border-surface-border hover:border-surface-raised"}`}>
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENTS[accent].primary }} />
                <span className="text-xs text-gray-300">{ACCENT_LABELS[accent]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wallpaper */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Chat Wallpaper</h3>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(WALLPAPERS) as WallpaperType[]).filter((w) => w !== "custom").map((wp) => (
              <button key={wp} onClick={() => setWallpaper(wp)}
                className={`h-14 rounded-xl border-2 transition-all overflow-hidden ${config.wallpaper === wp ? "border-brand-500" : "border-transparent hover:border-surface-border"}`}
                style={wp === "dots" ? { backgroundImage: WALLPAPERS.dots, backgroundSize: "10px 10px", backgroundColor: "#0f1117" }
                  : wp === "waves" ? { backgroundImage: WALLPAPERS.waves, backgroundColor: "#0f1117" }
                  : { background: WALLPAPERS[wp] || "#171b24" }}>
                {wp === "none" && <span className="w-full h-full flex items-center justify-center text-xs text-gray-600">None</span>}
              </button>
            ))}
            {/* Custom */}
            <button onClick={() => fileRef.current?.click()}
              className={`h-14 rounded-xl border-2 transition-all flex items-center justify-center text-xs text-gray-500 ${config.wallpaper === "custom" ? "border-brand-500" : "border-dashed border-surface-border hover:border-brand-500/50"}`}>
              {config.wallpaper === "custom" ? "✓" : "📷"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCustomWallpaper} />
          </div>
          <p className="text-xs text-gray-600 mt-2">Current: {WALLPAPER_LABELS[config.wallpaper]}</p>
        </div>

        {/* Font Size */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Font Size</h3>
          <div className="flex gap-2">
            {(["sm", "md", "lg"] as const).map((size) => (
              <button key={size} onClick={() => setFontSize(size)}
                className={`flex-1 py-2 rounded-xl border text-sm transition-all ${config.fontSize === size ? "border-brand-500 bg-brand-500/10 text-brand-500" : "border-surface-border text-gray-400 hover:border-brand-500/30"}`}>
                {size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"}
              </button>
            ))}
          </div>
        </div>

        {/* Bubble Style */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Bubble Style</h3>
          <div className="flex gap-2">
            {(["modern", "classic", "minimal"] as const).map((style) => (
              <button key={style} onClick={() => setBubbleStyle(style)}
                className={`flex-1 py-2 rounded-xl border text-sm capitalize transition-all ${config.bubbleStyle === style ? "border-brand-500 bg-brand-500/10 text-brand-500" : "border-surface-border text-gray-400 hover:border-brand-500/30"}`}>
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Other settings */}
        <div className="bg-surface-card border border-surface-border rounded-2xl divide-y divide-surface-border">
          {[
            { label: "Dark Mode", icon: "🌙", action: toggleTheme, value: theme === "dark" ? "On" : "Off" },
            { label: "Notification Sounds", icon: "🔔", action: handleSoundToggle, value: soundOn ? "On" : "Off" },
          ].map((item) => (
            <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-raised transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-sm text-white text-left">{item.label}</span>
              <span className={`text-xs font-medium ${item.value === "On" ? "text-brand-500" : "text-gray-500"}`}>{item.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
