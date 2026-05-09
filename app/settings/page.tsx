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
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const user = session?.user as any;

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: <I.Profile />, label: "Profile", desc: "Name, photo, bio", action: () => router.push("/profile") },
        { icon: <I.Lock />, label: "Privacy", desc: "Last seen, profile photo, about", action: () => {} },
        { icon: <I.Globe />, label: "Language", desc: "English", action: () => {} },
      ],
    },
    {
      title: "Preferences",
      items: [
        { 
          icon: theme === "dark" ? <I.Moon /> : <I.Sun />, 
          label: "Theme", 
          desc: theme === "dark" ? "Dark" : "Light", 
          action: toggleTheme,
          toggle: true,
        },
        { 
          icon: <I.Bell />, 
          label: "Notifications", 
          desc: notificationsEnabled ? "On" : "Off", 
          action: () => setNotificationsEnabled(!notificationsEnabled),
          toggle: true,
        },
        { icon: <I.Palette />, label: "Chat Wallpaper", desc: "Customize background", action: () => router.push("/appearance") },
      ],
    },
    {
      title: "Data & Storage",
      items: [
        { icon: <I.Database />, label: "Storage Usage", desc: "Manage storage", action: () => {} },
        { icon: <I.Database />, label: "Network Usage", desc: "View data usage", action: () => {} },
      ],
    },
    {
      title: "Help & About",
      items: [
        { icon: <I.Help />, label: "Help", desc: "Get support", action: () => {} },
        { icon: <I.Info />, label: "About", desc: "PulseChat v1.0.0", action: () => {} },
        { icon: <I.Heart />, label: "Tell a friend", desc: "Share PulseChat", action: () => {} },
      ],
    },
  ];

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => router.push("/chat")}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
          style={{ color: "var(--text-secondary)" }}>
          <I.Back />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* User Profile Card */}
        <button onClick={() => router.push("/profile")}
          className="w-full flex items-center gap-4 px-6 py-5 transition-all hover:bg-white/5"
          style={{ borderBottom: "1px solid var(--divider)" }}>
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: "var(--brand)" }}>
              {user?.name?.[0]}
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <p className="font-semibold text-lg truncate" style={{ color: "var(--text-primary)" }}>
              {user?.name}
            </p>
            <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
              {user?.email}
            </p>
          </div>
          <I.ChevronRight />
        </button>

        {/* Settings Sections */}
        {settingsSections.map((section, idx) => (
          <div key={idx} className="mt-6">
            <p className="px-6 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}>
              {section.title}
            </p>
            <div style={{ background: "var(--bg-sidebar)" }}>
              {section.items.map((item, i) => (
                <button key={i} onClick={item.action}
                  className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5"
                  style={{ borderBottom: i < section.items.length - 1 ? "1px solid var(--divider)" : "none" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--bg-input)", color: "var(--brand)" }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                    <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                  </div>
                  {item.toggle ? (
                    <div className="w-12 h-7 rounded-full transition-all flex-shrink-0"
                      style={{ 
                        background: (item.label === "Theme" && theme === "dark") || 
                                   (item.label === "Notifications" && notificationsEnabled)
                          ? "var(--brand)" : "var(--bg-input)",
                      }}>
                      <div className="w-5 h-5 rounded-full bg-white mt-1 transition-all"
                        style={{ 
                          marginLeft: (item.label === "Theme" && theme === "dark") || 
                                     (item.label === "Notifications" && notificationsEnabled)
                            ? "26px" : "4px",
                        }} />
                    </div>
                  ) : (
                    <I.ChevronRight />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="mt-8 px-6 pb-8">
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold transition-all active:scale-95"
            style={{ background: "#ef4444", color: "#fff" }}>
            <I.Logout />
            Log Out
          </button>
        </div>

        {/* Footer */}
        <div className="text-center px-6 pb-8">
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            PulseChat v1.0.0
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Made with ❤️ by Claude
          </p>
        </div>
      </div>
    </div>
  );
}
