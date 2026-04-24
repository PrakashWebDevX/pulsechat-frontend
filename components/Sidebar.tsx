"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Group, ChatTarget } from "@/types";
import { useTheme } from "@/lib/ThemeContext";
import CreateGroupModal from "./CreateGroupModal";

// ── SVG Icon components ───────────────────────────────────────────────────
const Icon = {
  Search:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Stories:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" opacity=".3"/><circle cx="12" cy="12" r="11" opacity=".15"/></svg>,
  Analytics: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  Palette:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  Bot:       () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01M12 15h.01"/></svg>,
  Sun:       () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  Moon:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Plus:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  Chat:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Group:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Phone:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Video:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Logout:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  Volume:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  Mute:      () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  Translate: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/></svg>,
};

interface Props {
  currentUser: User & { id: string };
  users: User[];
  groups: Group[];
  selectedTarget: ChatTarget | null;
  onlineUsers: string[];
  lastSeenMap: Record<string, string>;
  onSelectTarget: (target: ChatTarget) => void;
  onGroupCreated: (group: Group) => void;
  onCallUser?: (user: User, type: "video" | "voice") => void;
  onOpenAI?: () => void;
}

function formatLastSeen(iso: string): string {
  if (!iso) return "Offline";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function Sidebar({
  currentUser, users, groups, selectedTarget, onlineUsers,
  lastSeenMap, onSelectTarget, onGroupCreated, onCallUser, onOpenAI,
}: Props) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<"chats" | "groups">("chats");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const selectedId = selectedTarget?.kind === "user" ? selectedTarget.data._id
    : selectedTarget?.kind === "group" ? selectedTarget.data._id : null;

  const navItems = [
    { icon: <Icon.Search />,    title: "Search",      action: () => router.push("/search") },
    { icon: <Icon.Stories />,   title: "Stories",     action: () => router.push("/stories") },
    { icon: <Icon.Analytics />, title: "Analytics",   action: () => router.push("/analytics") },
    { icon: <Icon.Palette />,   title: "Appearance",  action: () => router.push("/appearance") },
    { icon: <Icon.Bot />,       title: "AI Assistant",action: onOpenAI },
    { icon: theme === "dark" ? <Icon.Sun /> : <Icon.Moon />, title: "Toggle Theme", action: toggleTheme },
    { icon: soundOn ? <Icon.Volume /> : <Icon.Mute />, title: "Sound", action: () => setSoundOn(!soundOn) },
    { icon: <Icon.Plus />,      title: "New Group",   action: () => setShowCreateGroup(true) },
  ];

  return (
    <>
      <aside className="w-full md:w-72 flex-shrink-0 flex flex-col h-full"
        style={{ background: "var(--bg-card)", borderRight: "1px solid var(--bg-border)" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="h-16 flex items-center justify-between px-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--bg-border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))" }}>
              <Icon.Chat />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>
              Pulse<span style={{ color: "var(--brand)" }}>Chat</span>
            </span>
          </div>

          {/* Nav icons */}
          <div className="flex items-center gap-0.5">
            {navItems.map((nav) => (
              <button key={nav.title} onClick={() => nav.action?.()}
                title={nav.title}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {nav.icon}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0" style={{ borderBottom: "1px solid var(--bg-border)" }}>
          {(["chats", "groups"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              style={{
                color: tab === t ? "var(--brand)" : "var(--text-muted)",
                borderBottom: tab === t ? `2px solid var(--brand)` : "2px solid transparent",
              }}>
              {t === "chats" ? <><Icon.Chat /><span>Chats</span></> : <><Icon.Group /><span>Groups ({groups.length})</span></>}
            </button>
          ))}
        </div>

        {/* ── List ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-2">
          {tab === "chats" ? (
            users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                  <Icon.Chat />
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No contacts yet</p>
              </div>
            ) : users.map((user) => {
              const isOnline = onlineUsers.includes(user._id);
              const isSelected = selectedId === user._id;
              const lastSeen = lastSeenMap[user._id];

              return (
                <div key={user._id} className="relative mx-2 mb-0.5"
                  onMouseEnter={() => setHoveredUser(user._id)}
                  onMouseLeave={() => setHoveredUser(null)}>
                  <button
                    onClick={() => onSelectTarget({ kind: "user", data: user })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: isSelected ? "var(--brand-glow)" : "transparent",
                      border: isSelected ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-raised)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt={user.name} className="w-11 h-11 rounded-full object-cover" style={{ border: "2px solid var(--bg-border)" }} />
                      ) : (
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))", color: "#fff" }}>
                          {user.name[0].toUpperCase()}
                        </div>
                      )}
                      {/* Online indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 transition-colors`}
                        style={{
                          background: isOnline ? "var(--brand)" : "var(--text-muted)",
                          borderColor: "var(--bg-card)",
                        }} />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-sm font-semibold truncate w-full" style={{ color: "var(--text-primary)" }}>
                        {user.name}
                      </span>
                      <span className="text-xs" style={{ color: isOnline ? "var(--brand)" : "var(--text-muted)" }}>
                        {isOnline ? "Online" : lastSeen ? formatLastSeen(lastSeen) : "Offline"}
                      </span>
                    </div>
                  </button>

                  {/* Call buttons on hover */}
                  {hoveredUser === user._id && isOnline && onCallUser && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 animate-fade-in z-10">
                      <button onClick={(e) => { e.stopPropagation(); onCallUser(user, "voice"); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "var(--brand-glow)", color: "var(--brand)" }}
                        title="Voice call">
                        <Icon.Phone />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onCallUser(user, "video"); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}
                        title="Video call">
                        <Icon.Video />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <>
              <button onClick={() => setShowCreateGroup(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-all mb-1"
                style={{ color: "var(--brand)", width: "calc(100% - 16px)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-glow)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div className="w-11 h-11 rounded-full border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: "var(--brand)" }}>
                  <Icon.Plus />
                </div>
                <span className="text-sm font-semibold">Create New Group</span>
              </button>

              {groups.map((group) => {
                const isSelected = selectedId === group._id;
                return (
                  <button key={group._id} onClick={() => onSelectTarget({ kind: "group", data: group })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-all mb-0.5 active:scale-[0.98]"
                    style={{
                      background: isSelected ? "var(--brand-glow)" : "transparent",
                      border: isSelected ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
                      width: "calc(100% - 16px)",
                    }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: "var(--bg-raised)", color: "var(--text-secondary)" }}>
                      <Icon.Group />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{group.name}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{group.members.length} members</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid var(--bg-border)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/profile")} className="relative flex-shrink-0 group">
              {currentUser?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUser.image} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover transition-all group-hover:ring-2"
                  style={{ border: "2px solid var(--bg-border)", outlineColor: "var(--brand)" }} />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))" }}>
                  {currentUser?.name?.[0] || "?"}
                </div>
              )}
              <div className="online-dot absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2"
                style={{ borderColor: "var(--bg-card)", borderRadius: "50%" }} />
            </button>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{currentUser?.name}</span>
              <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{currentUser?.email}</span>
            </div>

            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
              title="Sign out">
              <Icon.Logout />
            </button>
          </div>
        </div>
      </aside>

      {showCreateGroup && (
        <CreateGroupModal users={users} myId={currentUser.id}
          onClose={() => setShowCreateGroup(false)}
          onCreated={(g) => { onGroupCreated(g); setTab("groups"); }} />
      )}
    </>
  );
}
