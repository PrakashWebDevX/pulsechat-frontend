"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { User, Group, Message, SocketMessage, ChatTarget } from "@/types";
import {
  fetchUsers, fetchMessages, postMessage, editMessage,
  deleteMessage, reactToMessage, fetchGroups, fetchGroupMessages, postGroupMessage,
} from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";
import VideoCallModal from "@/components/VideoCallModal";
import SplashScreen from "@/components/SplashScreen";
import AIChatbot from "@/components/AIChatbot";

const I = {
  Back:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Phone:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0112 18.82 19.5 19.5 0 015.09 12 19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Video:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  Search:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Menu:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
  Translate:() => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/></svg>,
  Close:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const LANGUAGES = [
  "Tamil", "Hindi", "English", "Spanish", "French",
  "Arabic", "German", "Japanese", "Chinese", "Korean",
];

function formatLastSeen(iso?: string): string {
  if (!iso) return "last seen recently";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "last seen just now";
    if (mins < 60) return `last seen ${mins} minutes ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `last seen today at ${new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (hrs < 48) return `last seen yesterday at ${new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return `last seen ${new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" })}`;
  } catch { return "last seen recently"; }
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [splashDone, setSplashDone] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<ChatTarget | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [typingInfo, setTypingInfo] = useState<{ senderId: string; senderName?: string } | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTranslate, setShowTranslate] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Tamil");
  const [translating, setTranslating] = useState(false);

  const myId = (session?.user as any)?.id as string | undefined;
  const myName = (session?.user as any)?.name as string | undefined;
  const myImage = (session?.user as any)?.image as string | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Socket
  useEffect(() => {
    if (!myId) return;
    let socket: any;
    try { socket = connectSocket(myId); } catch { return; }

    socket.on("online_users", (ids: string[]) => {
      const safeIds = Array.isArray(ids) ? ids : [];
      setOnlineUsers(safeIds);
      setLastSeenMap((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((uid) => {
          if (!safeIds.includes(uid)) next[uid] = new Date().toISOString();
        });
        return next;
      });
    });

    const handleMsg = (data: SocketMessage) => {
      if (!data?.messageId) return;
      const msg: Message = {
        _id: data.messageId, senderId: data.senderId,
        receiverId: data.receiverId, groupId: data.groupId,
        message: data.message || "", type: data.type || "text",
        fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize,
        replyTo: data.replyTo, reactions: data.reactions || [],
        status: "delivered", edited: false, deleted: false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.createdAt || new Date().toISOString(),
      };
      setMessages((p) => [...p, msg]);
      // Update last message
      const key = data.groupId || data.senderId;
      setLastMessages((p) => ({ ...p, [key]: msg }));
      // Increment unread if not currently viewing this chat
      setSelectedTarget((current) => {
        const currentId = current?.kind === "user" ? current.data._id : current?.kind === "group" ? current.data._id : null;
        if (currentId !== key) {
          setUnreadCounts((p) => ({ ...p, [key]: (p[key] || 0) + 1 }));
        }
        return current;
      });
      socket.emit("message_read", { senderId: data.senderId, receiverId: myId });
    };

    socket.on("receive_message", handleMsg);
    socket.on("receive_group_message", handleMsg);

    socket.on("message_read", ({ receiverId }: any) => {
      setMessages((p) => p.map((m) => m.receiverId === receiverId && m.status !== "read" ? { ...m, status: "read" as const } : m));
    });
    socket.on("message_delivered", ({ messageId }: any) => {
      setMessages((p) => p.map((m) => m._id === messageId && m.status === "sent" ? { ...m, status: "delivered" as const } : m));
    });
    socket.on("typing", (d: any) => { try { setTypingInfo({ senderId: d.senderId, senderName: d.senderName }); } catch {} });
    socket.on("stop_typing", () => setTypingInfo(null));
    socket.on("message_reaction", (d: any) => {
      setMessages((p) => p.map((m) => {
        if (m._id !== d.messageId) return m;
        const reactions = [...(m.reactions || [])];
        const idx = reactions.findIndex((r) => r.userId === d.userId);
        if (idx !== -1) { if (reactions[idx].emoji === d.emoji) reactions.splice(idx, 1); else reactions[idx] = { ...reactions[idx], emoji: d.emoji }; }
        else reactions.push({ userId: d.userId, emoji: d.emoji });
        return { ...m, reactions };
      }));
    });
    socket.on("message_edited", (d: any) => {
      setMessages((p) => p.map((m) => m._id === d.messageId ? { ...m, message: d.message, edited: true } : m));
    });
    socket.on("message_deleted", (d: any) => {
      setMessages((p) => p.map((m) => m._id === d.messageId ? { ...m, deleted: true, message: "This message was deleted" } : m));
    });
    socket.on("incoming_call", ({ callerId, callerName, callerImage, callType, offer }: any) => {
      setActiveCall({ type: callType || "video", user: { _id: callerId, name: callerName || "Unknown", image: callerImage || "", email: "", createdAt: "" }, isIncoming: true, offer });
    });

    return () => {
      try {
        ["online_users","receive_message","receive_group_message","message_read","message_delivered",
          "typing","stop_typing","message_reaction","message_edited","message_deleted","incoming_call",
        ].forEach((e) => socket.off(e));
        disconnectSocket();
      } catch {}
    };
  }, [myId]);

  useEffect(() => {
    if (!myId) return;
    fetchUsers(myId).then(setUsers).catch(console.error);
    fetchGroups(myId).then((gs) => {
      setGroups(gs);
      try { getSocket().emit("join_groups", gs.map((g) => g._id)); } catch {}
    }).catch(console.error);
  }, [myId]);

  useEffect(() => {
    if (!myId || !selectedTarget) return;
    setLoadingMessages(true);
    const id = selectedTarget.kind === "user" ? selectedTarget.data._id : selectedTarget.data._id;
    // Clear unread
    setUnreadCounts((p) => ({ ...p, [id]: 0 }));
    const load = selectedTarget.kind === "user"
      ? fetchMessages(myId, selectedTarget.data._id)
      : fetchGroupMessages(selectedTarget.data._id);
    load.then((msgs) => {
      setMessages(msgs);
      if (msgs.length > 0) setLastMessages((p) => ({ ...p, [id]: msgs[msgs.length - 1] }));
    }).catch(console.error).finally(() => setLoadingMessages(false));
  }, [myId, selectedTarget]);

  const handleSend = useCallback(async (text: string, extras?: any) => {
    if (!myId || !selectedTarget) return;
    const socket = getSocket();
    const createdAt = new Date().toISOString();
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: Message = {
      _id: optimisticId, senderId: myId,
      receiverId: selectedTarget.kind === "user" ? selectedTarget.data._id : undefined,
      groupId: selectedTarget.kind === "group" ? selectedTarget.data._id : undefined,
      message: text || "", type: extras?.type || "text",
      fileUrl: extras?.fileUrl, fileName: extras?.fileName, fileSize: extras?.fileSize,
      replyTo: replyTo ? { _id: replyTo._id, message: replyTo.message, senderId: String(replyTo.senderId), type: replyTo.type } : undefined,
      reactions: [], status: "sent", edited: false, deleted: false,
      createdAt, updatedAt: createdAt,
    };
    setMessages((p) => [...p, optimistic]);
    setLastMessages((p) => ({ ...p, [selectedTarget.data._id]: optimistic }));
    setReplyTo(null);
    try {
      if (selectedTarget.kind === "user") {
        socket.emit("send_message", { ...optimistic, messageId: optimisticId });
        await postMessage(myId, selectedTarget.data._id, text, { type: extras?.type || "text", ...extras, replyTo: optimistic.replyTo });
      } else {
        socket.emit("send_group_message", { ...optimistic, messageId: optimisticId, groupId: selectedTarget.data._id, senderName: myName, senderImage: myImage });
        await postGroupMessage(selectedTarget.data._id, myId, text, { type: extras?.type || "text", ...extras, replyTo: optimistic.replyTo });
      }
    } catch (err) { console.error("Send failed:", err); }
  }, [myId, selectedTarget, replyTo, myName, myImage]);

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    if (!myId || !selectedTarget) return;
    try {
      const socket = getSocket();
      setMessages((p) => p.map((m) => {
        if (m._id !== messageId) return m;
        const reactions = [...(m.reactions || [])];
        const idx = reactions.findIndex((r) => r.userId === myId);
        if (idx !== -1) { if (reactions[idx].emoji === emoji) reactions.splice(idx, 1); else reactions[idx] = { userId: myId, emoji }; }
        else reactions.push({ userId: myId, emoji });
        return { ...m, reactions };
      }));
      const extra = selectedTarget.kind === "group" ? { groupId: selectedTarget.data._id } : { receiverId: selectedTarget.data._id };
      socket.emit("message_reaction", { messageId, userId: myId, emoji, senderId: myId, ...extra });
      await reactToMessage(messageId, myId, emoji);
    } catch {}
  }, [myId, selectedTarget]);

  const handleEditSave = useCallback(async (messageId: string, newText: string) => {
    if (!myId || !selectedTarget) return;
    try {
      const socket = getSocket();
      setMessages((p) => p.map((m) => m._id === messageId ? { ...m, message: newText, edited: true } : m));
      const extra = selectedTarget.kind === "group" ? { groupId: selectedTarget.data._id } : { receiverId: selectedTarget.data._id };
      socket.emit("message_edit", { messageId, message: newText, senderId: myId, ...extra });
      await editMessage(messageId, newText);
    } catch {}
  }, [myId, selectedTarget]);

  const handleDelete = useCallback(async (messageId: string) => {
    if (!myId || !selectedTarget) return;
    try {
      const socket = getSocket();
      setMessages((p) => p.map((m) => m._id === messageId ? { ...m, deleted: true, message: "This message was deleted" } : m));
      const extra = selectedTarget.kind === "group" ? { groupId: selectedTarget.data._id } : { receiverId: selectedTarget.data._id };
      socket.emit("message_delete", { messageId, senderId: myId, ...extra });
      await deleteMessage(messageId);
    } catch {}
  }, [myId, selectedTarget]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!myId || !selectedTarget) return;
    try {
      const extra = selectedTarget.kind === "group"
        ? { groupId: selectedTarget.data._id, senderName: myName }
        : { receiverId: selectedTarget.data._id };
      getSocket().emit(isTyping ? "typing" : "stop_typing", { senderId: myId, ...extra });
    } catch {}
  }, [myId, selectedTarget, myName]);

  const handleTranslate = async () => {
    setTranslating(true); setShowTranslate(false);
    try {
      const toTranslate = messages.filter((m) => m.type === "text" && m.message && !m.deleted);
      const results = await Promise.all(toTranslate.map(async (m) => {
        const res = await fetch("/api/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: m.message, targetLang: selectedLang }),
        });
        const d = await res.json();
        return { id: m._id, translated: d.translated || m.message };
      }));
      setMessages((p) => p.map((m) => {
        const t = results.find((r) => r.id === m._id);
        return t ? { ...m, message: t.translated } : m;
      }));
    } catch {} finally { setTranslating(false); }
  };

  const selectTarget = useCallback((t: ChatTarget) => {
    setSelectedTarget(t); setReplyTo(null); setEditingMsg(null);
    setShowSidebar(false); setShowSearch(false); setSearchQuery("");
  }, []);

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

  if (status === "loading" || !myId) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin"
          style={{ border: "3px solid var(--brand)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const isOnline = selectedTarget?.kind === "user" ? onlineUsers.includes(selectedTarget.data._id) : false;
  const isTyping = !!typingInfo && (selectedTarget?.kind === "user" ? typingInfo.senderId === selectedTarget.data._id : true);
  const typingLabel = selectedTarget?.kind === "group" && typingInfo?.senderName ? `${typingInfo.senderName} is typing…` : "typing…";
  const headerName = selectedTarget?.kind === "user" ? selectedTarget.data.name : selectedTarget?.kind === "group" ? selectedTarget.data.name : "";
  const headerImage = selectedTarget?.kind === "user" ? selectedTarget.data.image : selectedTarget?.kind === "group" ? selectedTarget.data.avatar : "";
  const lastSeen = selectedTarget?.kind === "user" ? lastSeenMap[selectedTarget.data._id] : undefined;
  const subText = selectedTarget?.kind === "group"
    ? `${selectedTarget.data.members.length} members`
    : isTyping ? "typing…"
    : isOnline ? "online"
    : formatLastSeen(lastSeen);

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--bg-app)" }}>
      {/* Sidebar */}
      <div className={`flex-shrink-0 ${showSidebar ? "flex w-full absolute inset-0 z-20 md:relative md:z-auto md:w-auto" : "hidden md:flex"}`}>
        <Sidebar
          currentUser={session!.user as any}
          users={users} groups={groups}
          selectedTarget={selectedTarget}
          onlineUsers={onlineUsers}
          lastSeenMap={lastSeenMap}
          lastMessages={lastMessages}
          unreadCounts={unreadCounts}
          onSelectTarget={selectTarget}
          onGroupCreated={(g) => setGroups((p) => [g, ...p])}
          onCallUser={(u, t) => setActiveCall({ type: t, user: u, isIncoming: false })}
          onOpenAI={() => setShowAI(true)}
        />
      </div>

      {/* Chat panel */}
      <div className={`flex-1 flex flex-col min-w-0 ${!showSidebar ? "flex" : "hidden md:flex"}`}
        style={{ background: "var(--bg-app)" }}>
        {selectedTarget ? (
          <>
            {/* ── WA-style Header ──────────────────────────────────── */}
            <div className="flex flex-col flex-shrink-0" style={{ background: "var(--bg-header)" }}>
              <div className="flex items-center gap-3 px-3 h-16">
                {/* Back */}
                <button onClick={() => { setShowSidebar(true); setSelectedTarget(null); setShowSearch(false); }}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-white/10 flex-shrink-0"
                  style={{ color: "var(--text-secondary)" }}>
                  <I.Back />
                </button>

                {/* Avatar — clickable for profile info */}
                <button className="relative flex-shrink-0">
                  {headerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={headerImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg"
                      style={{ background: "var(--brand)" }}>
                      {selectedTarget.kind === "group" ? "G" : headerName[0]}
                    </div>
                  )}
                  {selectedTarget.kind === "user" && isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                      style={{ background: "var(--brand-light)", borderColor: "var(--bg-header)" }} />
                  )}
                </button>

                {/* Name + status */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {}}>
                  <p className="font-semibold truncate leading-tight" style={{ color: "var(--text-primary)", fontSize: 16 }}>
                    {headerName}
                  </p>
                  <p className="text-xs truncate leading-tight" style={{ color: isTyping ? "var(--brand)" : "var(--text-muted)" }}>
                    {subText}
                  </p>
                </div>

                {/* Header action buttons */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {selectedTarget.kind === "user" && (
                    <>
                      <button onClick={() => setActiveCall({ type: "video", user: selectedTarget.data, isIncoming: false })}
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
                        style={{ color: "var(--text-secondary)" }}>
                        <I.Video />
                      </button>
                      <button onClick={() => setActiveCall({ type: "voice", user: selectedTarget.data, isIncoming: false })}
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
                        style={{ color: "var(--text-secondary)" }}>
                        <I.Phone />
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
                    style={{ color: showSearch ? "var(--brand)" : "var(--text-secondary)" }}>
                    <I.Search />
                  </button>
                  {/* Translate + menu */}
                  <div className="relative">
                    <button onClick={() => setShowTranslate(!showTranslate)}
                      className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
                      style={{ color: "var(--text-secondary)" }}>
                      <I.Menu />
                    </button>
                    {showTranslate && (
                      <div className="absolute top-12 right-0 z-50 rounded-xl shadow-2xl p-3 min-w-[200px] animate-scale-in"
                        style={{ background: "var(--bg-header)", border: "1px solid var(--divider)" }}>
                        <p className="text-xs font-semibold mb-2 px-1" style={{ color: "var(--text-muted)" }}>Translate chat to</p>
                        {LANGUAGES.map((lang) => (
                          <button key={lang} onClick={() => setSelectedLang(lang)}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                            style={{ color: selectedLang === lang ? "var(--brand)" : "var(--text-primary)", fontWeight: selectedLang === lang ? 600 : 400 }}>
                            {selectedLang === lang && "✓ "}{lang}
                          </button>
                        ))}
                        <div className="border-t mt-2 pt-2" style={{ borderColor: "var(--divider)" }}>
                          <button onClick={handleTranslate} disabled={translating}
                            className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{ background: "var(--brand)", color: "#fff" }}>
                            {translating ? "Translating…" : `Translate to ${selectedLang}`}
                          </button>
                        </div>
                        <button onClick={() => router.push("/search")}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm mt-1 transition-all hover:bg-white/10"
                          style={{ color: "var(--text-primary)" }}>
                          Search in chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search bar */}
              {showSearch && (
                <div className="px-4 pb-3 animate-slide-up">
                  <div className="wa-search">
                    <I.Search />
                    <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages…" />
                    {searchQuery && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(0,168,132,0.2)", color: "var(--brand)" }}>
                        {messages.filter((m) => m.message?.toLowerCase().includes(searchQuery.toLowerCase()) && !m.deleted).length} results
                      </span>
                    )}
                    <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                      <I.Close />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ChatWindow
              messages={messages} myId={myId} loading={loadingMessages}
              isTyping={isTyping} typingLabel={typingLabel}
              partnerName={headerName} searchQuery={searchQuery}
              onReact={handleReact} onReply={setReplyTo}
              onEdit={setEditingMsg} onDelete={handleDelete}
            />

            <MessageInput
              onSend={handleSend} onTyping={handleTyping}
              replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
              editingMsg={editingMsg} onCancelEdit={() => setEditingMsg(null)}
              onEditSave={handleEditSave} myId={myId}
            />
          </>
        ) : (
          /* WhatsApp desktop empty state */
          <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-5"
            style={{ background: "var(--bg-app)", borderLeft: "1px solid var(--divider)" }}>
            <div className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-header)" }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-light mb-3" style={{ color: "var(--text-primary)" }}>PulseChat</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Send and receive messages without keeping your phone online.</p>
              <p className="mt-1" style={{ color: "var(--text-muted)", fontSize: 14 }}>Use PulseChat on up to 4 linked devices.</p>
            </div>
            <div className="flex items-center gap-2 mt-4" style={{ color: "var(--text-muted)", fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Your personal messages are end-to-end encrypted
            </div>
          </div>
        )}
      </div>

      {activeCall && myId && (
        <VideoCallModal
          callType={activeCall.type} targetUser={activeCall.user}
          myId={myId} myName={myName || ""} myImage={myImage}
          isIncoming={activeCall.isIncoming} offer={activeCall.offer}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {showAI && <AIChatbot onClose={() => setShowAI(false)} />}
    </div>
  );
}
