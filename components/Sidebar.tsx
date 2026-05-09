"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Group, ChatTarget, Message } from "@/types";
import { useTheme } from "@/lib/ThemeContext";
import CreateGroupModal from "./CreateGroupModal";

// SVG Icons
const I = {
  Chats:     () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Calls:     () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0112 18.82 19.5 19.5 0 015.09 12 19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Stories:   () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><circle cx="12" cy="8" r="7" strokeDasharray="3 2" opacity=".5"/><path d="M6 21v-1a6 6 0 0112 0v1"/></svg>,
  Groups:    () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Search:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  NewChat:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Menu:      () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>,
  Settings:  () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Moon:      () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Sun:       () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Logout:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  Bot:       () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01M12 15h.01"/></svg>,
};

function timeAgo(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 1) return "Yesterday";
    if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch { return ""; }
}

function lastMsgPreview(msg?: Message): string {
  if (!msg) return "Tap to start chatting";
  if (msg.deleted) return "🚫 This message was deleted";
  if (msg.type === "image") return "📷 Photo";
  if (msg.type === "audio") return "🎤 Voice message";
  if (msg.type === "file") return `📎 ${msg.fileName || "File"}`;
  return msg.message || "";
}

interface Props {
  currentUser: User & { id: string };
  users: User[];
  groups: Group[];
  selectedTarget: ChatTarget | null;
  onlineUsers: string[];
  lastSeenMap: Record<string, string>;
  lastMessages: Record<string, Message>;
  unreadCounts: Record<string, number>;
  onSelectTarget: (t: ChatTarget) => void;
  onGroupCreated: (g: Group) => void;
  onCallUser?: (u: User, t: "video"|"voice") => void;
  onOpenAI?: () => void;
}

export default function Sidebar({
  currentUser, users, groups, selectedTarget, onlineUsers, lastSeenMap,
  lastMessages, unreadCounts, onSelectTarget, onGroupCreated, onCallUser, onOpenAI,
}: Props) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<"chats"|"groups">("chats");
  const [search, setSearch] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const selectedId = selectedTarget?.kind === "user" ? selectedTarget.data._id
    : selectedTarget?.kind === "group" ? selectedTarget.data._id : null;

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <aside className="flex h-full w-full md:w-[360px] flex-shrink-0"
        style={{ background: "var(--bg-sidebar)", borderRight: `1px solid var(--divider)` }}>

        {/* ── Left icon strip (desktop only) ───────────────────────── */}
        <div className="hidden md:flex flex-col items-center py-3 gap-1 flex-shrink-0"
          style={{ width: 56, background: "var(--bg-app)", borderRight: `1px solid var(--divider)` }}>

          {/* Avatar */}
          <button onClick={() => router.push("/profile")} className="mb-2">
            {currentUser?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUser.image} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
                style={{ background: "var(--brand)" }}>{currentUser?.name?.[0]}</div>
            )}
          </button>

          {/* Chats */}
          <button onClick={() => setTab("chats")} title="Chats"
            className={`wa-nav-icon ${tab === "chats" ? "active" : ""}`}>
            <I.Chats />
          </button>

          {/* Calls */}
          <button onClick={() => router.push("/calls")} title="Calls" className="wa-nav-icon">
            <I.Calls />
          </button>

          {/* Stories */}
          <button onClick={() => router.push("/stories")} title="Status" className="wa-nav-icon">
            <I.Stories />
          </button>

          {/* Groups */}
          <button onClick={() => setTab("groups")} title="Groups"
            className={`wa-nav-icon ${tab === "groups" ? "active" : ""}`}>
            <I.Groups />
          </button>

          <div className="flex-1" />

          {/* Theme */}
          <button onClick={toggleTheme} className="wa-nav-icon" title="Theme">
            {theme === "dark" ? <I.Sun /> : <I.Moon />}
          </button>

          {/* AI */}
          <button onClick={onOpenAI} className="wa-nav-icon" title="AI">
            <I.Bot />
          </button>

          {/* Settings */}
          <button onClick={() => router.push("/settings")} className="wa-nav-icon" title="Settings">
            <I.Settings />
          </button>

          {/* Logout */}
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="wa-nav-icon" title="Logout" style={{ color: "#ef4444" }}>
            <I.Logout />
          </button>
        </div>

        {/* ── Right panel: search + list ────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: "var(--bg-header)" }}>
            <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {tab === "chats" ? "Chats" : "Groups"}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCreateGroup(true)}
                className="wa-nav-icon" title="New group/chat">
                <I.NewChat />
              </button>
              <button className="wa-nav-icon" title="Menu">
                <I.Menu />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 overflow-x-auto"
            style={{ background: "var(--bg-header)", borderBottom: `1px solid var(--divider)` }}>
            {["All", "Unread", "Favourites", "Groups"].map((label, i) => (
              <button key={label}
                onClick={() => { if (label === "Groups") setTab("groups"); else setTab("chats"); }}
                className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  background: (i === 0 && tab === "chats") || (label === "Groups" && tab === "groups")
                    ? "var(--brand-light)" : "var(--bg-input)",
                  color: (i === 0 && tab === "chats") || (label === "Groups" && tab === "groups")
                    ? "#111" : "var(--text-secondary)",
                }}>
                {label}
                {label === "Unread" && Object.values(unreadCounts).some((c) => c > 0) && (
                  <span className="ml-1">{Object.values(unreadCounts).reduce((a, b) => a + b, 0)}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 py-2 flex-shrink-0" style={{ background: "var(--bg-header)" }}>
            <div className="wa-search">
              <I.Search />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or start new chat" />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {tab === "chats" ? (
              filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <I.Chats />
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No chats found</p>
                </div>
              ) : filteredUsers.map((user) => {
                const isOnline = onlineUsers.includes(user._id);
                const isSelected = selectedId === user._id;
                const lastMsg = lastMessages[user._id];
                const unread = unreadCounts[user._id] || 0;

                return (
                  <button key={user._id}
                    onClick={() => onSelectTarget({ kind: "user", data: user })}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.99]"
                    style={{
                      background: isSelected ? "var(--bg-item-sel)" : "transparent",
                      borderBottom: `1px solid var(--divider)`,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-item-hover)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div className="relative flex-shrink-0">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                          style={{ background: "var(--brand)" }}>
                          {user.name[0].toUpperCase()}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                          style={{ background: "var(--brand-light)", borderColor: "var(--bg-sidebar)" }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold truncate text-[15px]" style={{ color: "var(--text-primary)" }}>
                          {user.name}
                        </span>
                        <span className="text-[11px] ml-2 flex-shrink-0" style={{ color: unread ? "var(--brand-light)" : "var(--text-muted)" }}>
                          {timeAgo(lastMsg?.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] truncate flex-1" style={{ color: "var(--text-secondary)" }}>
                          {lastMsgPreview(lastMsg)}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {unread > 0 && (
                            <span className="unread-badge">{unread > 99 ? "99+" : unread}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <>
                <button onClick={() => setShowCreateGroup(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all"
                  style={{ borderBottom: `1px solid var(--divider)`, color: "var(--brand)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-item-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed"
                    style={{ borderColor: "var(--brand)" }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-[15px]">New Group</span>
                </button>
                {filteredGroups.map((group) => {
                  const isSelected = selectedId === group._id;
                  const lastMsg = lastMessages[group._id];
                  return (
                    <button key={group._id}
                      onClick={() => onSelectTarget({ kind: "group", data: group })}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-all"
                      style={{
                        background: isSelected ? "var(--bg-item-sel)" : "transparent",
                        borderBottom: `1px solid var(--divider)`,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-item-hover)"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                        <I.Groups />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-[15px] truncate" style={{ color: "var(--text-primary)" }}>{group.name}</span>
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{timeAgo(lastMsg?.createdAt)}</span>
                        </div>
                        <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                          {group.members.length} members
                        </span>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Mobile bottom nav */}
          <div className="flex md:hidden items-center justify-around py-2 flex-shrink-0 safe-pb"
            style={{ background: "var(--bg-header)", borderTop: `1px solid var(--divider)` }}>
            {[
              { label: "Chats", icon: <I.Chats />, action: () => setTab("chats"), active: tab === "chats" },
              { label: "Status", icon: <I.Stories />, action: () => router.push("/stories"), active: false },
              { label: "Groups", icon: <I.Groups />, action: () => setTab("groups"), active: tab === "groups" },
              { label: "Settings", icon: <I.Settings />, action: () => router.push("/settings"), active: false },
            ].map((item) => (
              <button key={item.label} onClick={item.action}
                className="flex flex-col items-center gap-1 px-4 py-1"
                style={{ color: item.active ? "var(--brand)" : "var(--text-muted)" }}>
                {item.icon}
                <span style={{ fontSize: 11 }}>{item.label}</span>
              </button>
            ))}
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
