"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/lib/ThemeContext";

const I = {
  Back:  () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Moon:  () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Sun:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Bell:  () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Lock:  () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Globe: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  Palette: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/><circle cx="16" cy="10" r="1.5" fill="currentColor"/><circle cx="14.5" cy="14.5" r="1.5" fill="currentColor"/><circle cx="9.5" cy="14.5" r="1.5" fill="currentColor"/></svg>,
  User:  () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Logout:() => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  Database:() => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
};

type View = "main" | "theme" | "wallpaper" | "privacy" | "language" | "notifications" | "storage";

const WALLPAPERS = [
  { id: "default",    name: "WA Classic",    previewDark: "#0b141a",  previewLight: "#efeae2" },
  { id: "pattern",    name: "Diagonal",      previewDark: "#0d1b22",  previewLight: "#e8f5e9" },
  { id: "gradient",   name: "Gradient",      previewDark: "linear-gradient(160deg,#0b141a,#1a1a2e)", previewLight: "linear-gradient(160deg,#e8f5e9,#e3f2fd)" },
  { id: "solid-dark", name: "Solid Black",   previewDark: "#000",     previewLight: "#f5f5f5" },
  { id: "nature",     name: "Nature",        previewDark: "linear-gradient(135deg,#0a3d2e,#0b141a)", previewLight: "linear-gradient(135deg,#c8e6c9,#efeae2)" },
  { id: "abstract",   name: "Abstract",      previewDark: "linear-gradient(135deg,#1a0b2e,#0b141a)", previewLight: "linear-gradient(135deg,#ede7f6,#efeae2)" },
];

const LANGUAGES = ["English","Tamil","Hindi","Spanish","French","Arabic","German","Japanese","Chinese","Korean"];

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className="w-12 h-7 rounded-full transition-all duration-300 relative flex-shrink-0"
      style={{ background: value ? "var(--brand)" : "var(--bg-input)" }}>
      <div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all duration-300 shadow"
        style={{ left: value ? "26px" : "4px" }} />
    </button>
  );
}

function Row({ icon, label, desc, action, toggle, toggleValue, iconBg }: any) {
  return (
    <button onClick={action}
      className="w-full flex items-center gap-4 px-5 py-4 transition-all active:bg-white/5 hover:bg-white/5"
      style={{ borderBottom: "1px solid var(--divider)" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg || "var(--bg-input)", color: "var(--brand)" }}>
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="font-medium text-[15px]" style={{ color: "var(--text-primary)" }}>{label}</p>
        {desc && <p className="text-sm truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>}
      </div>
      {toggle !== undefined
        ? <Toggle value={toggle} onChange={action} />
        : <div style={{ color: "var(--text-muted)" }}><I.ChevronRight /></div>}
    </button>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, wallpaper, setTheme, setWallpaper } = useTheme();
  const user = session?.user as any;

  const [view, setView] = useState<View>("main");
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound]         = useState(true);
  const [vibration, setVibration] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [lastSeen, setLastSeen]   = useState<"everyone"|"contacts"|"nobody">("everyone");
  const [profilePhoto, setProfilePhoto] = useState<"everyone"|"contacts"|"nobody">("everyone");
  const [readReceipts, setReadReceipts] = useState(true);
  const [language, setLanguage]   = useState("English");

  if (view === "theme") return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => setView("main")} className="wa-nav-icon"><I.Back /></button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Theme</h1>
      </div>
      <div className="flex-1 p-6 space-y-4">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Choose your preferred theme</p>
        {[
          { value: "dark", label: "Dark", desc: "Dark background, easy on eyes at night", preview: "#0b141a" },
          { value: "light", label: "Light", desc: "Light background, great for daytime", preview: "#f0f2f5" },
        ].map((t) => (
          <button key={t.value} onClick={() => setTheme(t.value as any)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
            style={{
              background: theme === t.value ? "rgba(0,168,132,0.12)" : "var(--bg-sidebar)",
              border: `2px solid ${theme === t.value ? "var(--brand)" : "transparent"}`,
            }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: t.preview }}>
              {t.value === "dark" ? <I.Moon /> : <I.Sun />}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{t.label}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t.desc}</p>
            </div>
            {theme === t.value && <div style={{ color: "var(--brand)" }}><I.Check /></div>}
          </button>
        ))}
        {/* Live preview */}
        <div className="rounded-2xl p-4 mt-4" style={{ background: "var(--bg-sidebar)", border: "1px solid var(--divider)" }}>
          <p className="text-sm font-medium mb-3" style={{ color: "var(--text-muted)" }}>Preview</p>
          <div className="rounded-xl overflow-hidden" style={{ background: theme === "dark" ? "#0b141a" : "#efeae2" }}>
            <div className="px-4 py-2" style={{ background: theme === "dark" ? "#202c33" : "#f0f2f5" }}>
              <p className="text-sm font-semibold" style={{ color: theme === "dark" ? "#e9edef" : "#111b21" }}>Chat Header</p>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-end">
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: theme === "dark" ? "#005c4b" : "#d9fdd3", color: theme === "dark" ? "#e9edef" : "#111b21" }}>
                  Hello! 👋
                </div>
              </div>
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: theme === "dark" ? "#202c33" : "#ffffff", color: theme === "dark" ? "#e9edef" : "#111b21" }}>
                  Hi there!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (view === "wallpaper") return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => setView("main")} className="wa-nav-icon"><I.Back /></button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Chat Wallpaper</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Selected: <span style={{ color: "var(--brand)", fontWeight: 600 }}>{WALLPAPERS.find(w => w.id === wallpaper)?.name}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {WALLPAPERS.map((wp) => {
            const preview = theme === "dark" ? wp.previewDark : wp.previewLight;
            const isSelected = wallpaper === wp.id;
            return (
              <button key={wp.id} onClick={() => setWallpaper(wp.id as any)}
                className="aspect-[3/4] rounded-2xl overflow-hidden relative transition-all active:scale-95"
                style={{ border: `3px solid ${isSelected ? "var(--brand)" : "transparent"}` }}>
                <div className="w-full h-full" style={{ background: preview }} />
                {/* Mini chat preview */}
                <div className="absolute inset-0 flex flex-col justify-end p-2 gap-1">
                  <div className="self-end px-2 py-1 rounded text-xs"
                    style={{ background: theme === "dark" ? "#005c4b" : "#d9fdd3", color: theme === "dark" ? "#fff" : "#111", fontSize: 9 }}>
                    Hi! 😊
                  </div>
                  <div className="self-start px-2 py-1 rounded text-xs"
                    style={{ background: theme === "dark" ? "#202c33" : "#fff", color: theme === "dark" ? "#fff" : "#111", fontSize: 9 }}>
                    Hello!
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "var(--brand)" }}>
                    <I.Check />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 py-2 px-3"
                  style={{ background: "rgba(0,0,0,0.6)", fontSize: 11, color: "#fff", fontWeight: isSelected ? 700 : 400 }}>
                  {wp.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (view === "notifications") return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => setView("main")} className="wa-nav-icon"><I.Back /></button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Notifications</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mt-4" style={{ background: "var(--bg-sidebar)" }}>
          <Row icon={<I.Bell />} label="Notifications" desc={notifications ? "Enabled" : "Disabled"} action={() => setNotifications(!notifications)} toggle={notifications} />
          <Row icon={<I.Bell />} label="Message sounds" desc={sound ? "On" : "Off"} action={() => setSound(!sound)} toggle={sound} />
          <Row icon={<I.Bell />} label="Vibration" desc={vibration ? "On" : "Off"} action={() => setVibration(!vibration)} toggle={vibration} />
          <Row icon={<I.Bell />} label="Message preview" desc={messagePreview ? "Show message content" : "Hidden"} action={() => setMessagePreview(!messagePreview)} toggle={messagePreview} />
        </div>
      </div>
    </div>
  );

  if (view === "privacy") return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => setView("main")} className="wa-nav-icon"><I.Back /></button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Privacy</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {[
          { label: "Last seen & Online", value: lastSeen, set: setLastSeen },
          { label: "Profile photo", value: profilePhoto, set: setProfilePhoto },
        ].map((item) => (
          <div key={item.label}>
            <p className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{item.label}</p>
            <div className="space-y-2">
              {(["everyone", "contacts", "nobody"] as const).map((opt) => (
                <button key={opt} onClick={() => item.set(opt)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                  style={{ background: item.value === opt ? "rgba(0,168,132,0.12)" : "var(--bg-sidebar)", border: `2px solid ${item.value === opt ? "var(--brand)" : "transparent"}` }}>
                  <span style={{ color: "var(--text-primary)", textTransform: "capitalize", fontWeight: item.value === opt ? 600 : 400 }}>{opt}</span>
                  {item.value === opt && <div style={{ color: "var(--brand)" }}><I.Check /></div>}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <p className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Read receipts</p>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--bg-sidebar)" }}>
            <div>
              <p style={{ color: "var(--text-primary)" }}>Show read receipts</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Show blue ticks when message is read</p>
            </div>
            <Toggle value={readReceipts} onChange={() => setReadReceipts(!readReceipts)} />
          </div>
        </div>
      </div>
    </div>
  );

  if (view === "language") return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => setView("main")} className="wa-nav-icon"><I.Back /></button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Language</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {LANGUAGES.map((lang) => (
          <button key={lang} onClick={() => setLanguage(lang)}
            className="w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all"
            style={{ background: language === lang ? "rgba(0,168,132,0.12)" : "var(--bg-sidebar)", border: `2px solid ${language === lang ? "var(--brand)" : "transparent"}` }}>
            <span style={{ color: "var(--text-primary)", fontWeight: language === lang ? 700 : 400 }}>{lang}</span>
            {language === lang && <div style={{ color: "var(--brand)" }}><I.Check /></div>}
          </button>
        ))}
      </div>
    </div>
  );

  if (view === "storage") return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => setView("main")} className="wa-nav-icon"><I.Back /></button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Storage</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center mb-8 py-6 rounded-2xl" style={{ background: "var(--bg-sidebar)" }}>
          <p className="text-4xl font-bold mb-1" style={{ color: "var(--brand)" }}>42.8 MB</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Total storage used</p>
        </div>
        {[
          { label: "Messages", size: "12.3 MB", pct: 30, color: "#00a884" },
          { label: "Photos", size: "18.5 MB", pct: 45, color: "#3b82f6" },
          { label: "Videos", size: "8.2 MB", pct: 20, color: "#f59e0b" },
          { label: "Documents", size: "3.8 MB", pct: 5, color: "#8b5cf6" },
        ].map((item) => (
          <div key={item.label} className="mb-5">
            <div className="flex justify-between mb-2">
              <span style={{ color: "var(--text-primary)" }}>{item.label}</span>
              <span style={{ color: "var(--text-muted)" }}>{item.size}</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, background: item.color }} />
            </div>
          </div>
        ))}
        <button className="w-full mt-4 py-4 rounded-2xl font-semibold active:scale-95 transition-all"
          style={{ background: "#ef4444", color: "#fff" }}>
          Clear Cache
        </button>
      </div>
    </div>
  );

  // ── MAIN ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => router.push("/chat")} className="wa-nav-icon"><I.Back /></button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile card */}
        <button onClick={() => router.push("/profile")}
          className="w-full flex items-center gap-4 px-5 py-5 hover:bg-white/5 transition-all"
          style={{ borderBottom: "1px solid var(--divider)" }}>
          {user?.image
            ? <img src={user.image} alt="" className="w-16 h-16 rounded-full object-cover" />
            : <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: "var(--brand)" }}>{user?.name?.[0]}</div>}
          <div className="flex-1 text-left min-w-0">
            <p className="font-semibold text-lg truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          </div>
          <I.ChevronRight />
        </button>

        {/* Account */}
        <p className="px-5 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Account</p>
        <div style={{ background: "var(--bg-sidebar)" }}>
          <Row icon={<I.User />}  label="Profile"  desc="Name, photo, bio" action={() => router.push("/profile")} />
          <Row icon={<I.Lock />}  label="Privacy"  desc="Last seen, read receipts" action={() => setView("privacy")} />
          <Row icon={<I.Globe />} label="Language" desc={language} action={() => setView("language")} />
        </div>

        {/* Appearance */}
        <p className="px-5 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Appearance</p>
        <div style={{ background: "var(--bg-sidebar)" }}>
          <Row icon={theme === "dark" ? <I.Moon /> : <I.Sun />}
            label="Theme" desc={theme === "dark" ? "Dark mode" : "Light mode"}
            action={() => setView("theme")} />
          <Row icon={<I.Palette />} label="Chat Wallpaper"
            desc={WALLPAPERS.find(w => w.id === wallpaper)?.name || "Default"}
            action={() => setView("wallpaper")} />
        </div>

        {/* Notifications */}
        <p className="px-5 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Notifications</p>
        <div style={{ background: "var(--bg-sidebar)" }}>
          <Row icon={<I.Bell />} label="Notifications" desc={notifications ? "On" : "Off"} action={() => setView("notifications")} />
        </div>

        {/* Storage */}
        <p className="px-5 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Storage</p>
        <div style={{ background: "var(--bg-sidebar)" }}>
          <Row icon={<I.Database />} label="Storage Usage" desc="42.8 MB used" action={() => setView("storage")} />
        </div>

        {/* Logout */}
        <div className="p-5 pb-10">
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold active:scale-95 transition-all"
            style={{ background: "#ef4444", color: "#fff" }}>
            <I.Logout /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
