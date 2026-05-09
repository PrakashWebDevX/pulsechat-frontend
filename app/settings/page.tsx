"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

const I = {
  Back:      () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Profile:   () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Bell:      () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Lock:      () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Palette:   () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.93 0 1.71-.75 1.71-1.71 0-.42-.16-.81-.44-1.1-.28-.28-.44-.66-.44-1.09 0-.93.76-1.69 1.69-1.69h1.98c3.03 0 5.5-2.47 5.5-5.5C22 6.48 17.52 2 12 2z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="9.5" cy="7.5" r="1.5"/><circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/></svg>,
  Globe:     () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  Database:  () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Help:      () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>,
  Info:      () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Heart:     () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  Logout:    () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Moon:      () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Sun:       () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Check:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

type View = "main" | "privacy" | "language" | "storage" | "wallpaper";

const LANGUAGES = [
  "English", "Tamil", "Hindi", "Spanish", "French", "Arabic", "German", "Japanese", "Chinese", "Korean"
];

const WALLPAPERS = [
  { name: "Default Dark", value: "dark" },
  { name: "Default Light", value: "light" },
  { name: "WhatsApp Pattern", value: "pattern" },
  { name: "Solid Dark", value: "solid-dark" },
  { name: "Gradient", value: "gradient" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [view, setView] = useState<View>("main");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState<"everyone" | "contacts" | "nobody">("everyone");
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState<"everyone" | "contacts" | "nobody">("everyone");
  const [aboutPrivacy, setAboutPrivacy] = useState<"everyone" | "contacts" | "nobody">("everyone");
  
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedWallpaper, setSelectedWallpaper] = useState("dark");

  const user = session?.user as any;

  // Main View
  if (view === "main") {
    return (
      <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
          style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
          <button onClick={() => router.push("/chat")}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}>
            <I.Back />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          <button onClick={() => router.push("/profile")}
            className="w-full flex items-center gap-4 px-6 py-5 transition-all hover:bg-white/5"
            style={{ borderBottom: "1px solid var(--divider)" }}>
            {user?.image ? (
              <img src={user.image} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ background: "var(--brand)" }}>
                {user?.name?.[0]}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-lg truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
              <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
            </div>
            <I.ChevronRight />
          </button>

          <div className="mt-6">
            <p className="px-6 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Account</p>
            <div style={{ background: "var(--bg-sidebar)" }}>
              <button onClick={() => router.push("/profile")}
                className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5"
                style={{ borderBottom: "1px solid var(--divider)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--brand)" }}>
                  <I.Profile />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>Profile</p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>Name, photo, bio</p>
                </div>
                <I.ChevronRight />
              </button>
              <button onClick={() => setView("privacy")}
                className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5"
                style={{ borderBottom: "1px solid var(--divider)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--brand)" }}>
                  <I.Lock />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>Privacy</p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>Control your privacy</p>
                </div>
                <I.ChevronRight />
              </button>
              <button onClick={() => setView("language")}
                className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--brand)" }}>
                  <I.Globe />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>Language</p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{selectedLanguage}</p>
                </div>
                <I.ChevronRight />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="px-6 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Preferences</p>
            <div style={{ background: "var(--bg-sidebar)" }}>
              <button onClick={toggleTheme}
                className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5"
                style={{ borderBottom: "1px solid var(--divider)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--brand)" }}>
                  {theme === "dark" ? <I.Moon /> : <I.Sun />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>Theme</p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{theme === "dark" ? "Dark" : "Light"}</p>
                </div>
                <div className="w-12 h-7 rounded-full transition-all flex-shrink-0 relative"
                  style={{ background: theme === "dark" ? "var(--brand)" : "var(--bg-input)" }}>
                  <div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all"
                    style={{ left: theme === "dark" ? "26px" : "4px" }} />
                </div>
              </button>
              <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5"
                style={{ borderBottom: "1px solid var(--divider)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--brand)" }}>
                  <I.Bell />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>Notifications</p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{notificationsEnabled ? "On" : "Off"}</p>
                </div>
                <div className="w-12 h-7 rounded-full transition-all flex-shrink-0 relative"
                  style={{ background: notificationsEnabled ? "var(--brand)" : "var(--bg-input)" }}>
                  <div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all"
                    style={{ left: notificationsEnabled ? "26px" : "4px" }} />
                </div>
              </button>
              <button onClick={() => setView("wallpaper")}
                className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--brand)" }}>
                  <I.Palette />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>Chat Wallpaper</p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>Customize background</p>
                </div>
                <I.ChevronRight />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="px-6 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Data & Storage</p>
            <div style={{ background: "var(--bg-sidebar)" }}>
              <button onClick={() => setView("storage")}
                className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-input)", color: "var(--brand)" }}>
                  <I.Database />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>Storage Usage</p>
                  <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>View storage</p>
                </div>
                <I.ChevronRight />
              </button>
            </div>
          </div>

          <div className="mt-8 px-6 pb-8">
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold transition-all active:scale-95"
              style={{ background: "#ef4444", color: "#fff" }}>
              <I.Logout />
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Privacy View
  if (view === "privacy") {
    return (
      <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
          style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
          <button onClick={() => setView("main")}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}>
            <I.Back />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Privacy</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Control who can see your information</p>

          {[
            { label: "Last seen", value: lastSeenPrivacy, set: setLastSeenPrivacy },
            { label: "Profile photo", value: profilePhotoPrivacy, set: setProfilePhotoPrivacy },
            { label: "About", value: aboutPrivacy, set: setAboutPrivacy },
          ].map((opt, idx) => (
            <div key={idx} className="mb-6">
              <p className="font-medium mb-3" style={{ color: "var(--text-primary)" }}>{opt.label}</p>
              <div className="space-y-2">
                {(["everyone", "contacts", "nobody"] as const).map((choice) => (
                  <button key={choice}
                    onClick={() => opt.set(choice)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                    style={{ 
                      background: opt.value === choice ? "rgba(0,168,132,0.15)" : "var(--bg-input)",
                      border: opt.value === choice ? "2px solid var(--brand)" : "2px solid transparent",
                    }}>
                    <span style={{ color: "var(--text-primary)", textTransform: "capitalize", fontWeight: opt.value === choice ? 600 : 400 }}>{choice}</span>
                    {opt.value === choice && <div style={{ color: "var(--brand)" }}><I.Check /></div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Language View
  if (view === "language") {
    return (
      <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
          style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
          <button onClick={() => setView("main")}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}>
            <I.Back />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Language</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {LANGUAGES.map((lang) => (
            <button key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className="w-full flex items-center justify-between px-4 py-4 rounded-xl mb-2 transition-all"
              style={{ 
                background: selectedLanguage === lang ? "rgba(0,168,132,0.15)" : "var(--bg-input)",
                border: selectedLanguage === lang ? "2px solid var(--brand)" : "2px solid transparent",
              }}>
              <span style={{ color: "var(--text-primary)", fontWeight: selectedLanguage === lang ? 600 : 400 }}>{lang}</span>
              {selectedLanguage === lang && <div style={{ color: "var(--brand)" }}><I.Check /></div>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Wallpaper View
  if (view === "wallpaper") {
    return (
      <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
          style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
          <button onClick={() => setView("main")}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}>
            <I.Back />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Chat Wallpaper</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {WALLPAPERS.map((wp) => (
              <button key={wp.value}
                onClick={() => setSelectedWallpaper(wp.value)}
                className="aspect-square rounded-2xl overflow-hidden relative transition-all"
                style={{ 
                  border: selectedWallpaper === wp.value ? "3px solid var(--brand)" : "3px solid transparent",
                }}>
                <div className={`w-full h-full ${
                  wp.value === "dark" ? "bg-gray-900" :
                  wp.value === "light" ? "bg-gray-100" :
                  wp.value === "pattern" ? "chat-bg-dark" :
                  wp.value === "solid-dark" ? "bg-black" :
                  "bg-gradient-to-br from-purple-500 to-pink-500"
                }`} />
                {selectedWallpaper === wp.value && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "var(--brand)", color: "#fff" }}>
                    <I.Check />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-medium"
                  style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                  {wp.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Storage View
  if (view === "storage") {
    return (
      <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
          style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
          <button onClick={() => setView("main")}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}>
            <I.Back />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Storage Usage</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold mb-2" style={{ color: "var(--brand)" }}>42.8 MB</div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Total storage used</p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Messages", size: "12.3 MB", percent: 30 },
              { label: "Photos", size: "18.5 MB", percent: 45 },
              { label: "Videos", size: "8.2 MB", percent: 20 },
              { label: "Documents", size: "3.8 MB", percent: 5 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-2">
                  <span style={{ color: "var(--text-primary)" }}>{item.label}</span>
                  <span style={{ color: "var(--text-muted)" }}>{item.size}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                  <div className="h-full rounded-full" style={{ width: `${item.percent}%`, background: "var(--brand)" }} />
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-8 py-4 rounded-2xl font-semibold transition-all active:scale-95"
            style={{ background: "var(--brand)", color: "#fff" }}>
            Clear Cache
          </button>
        </div>
      </div>
    );
  }

  return null;
}
