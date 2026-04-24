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

// SVG Icons
const Icons = {
  Phone:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 13a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Video:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  Search:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Translate:() => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/></svg>,
  Back:     () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Close:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const LANGUAGES = [
  { code: "Tamil", label: "தமிழ் Tamil" },
  { code: "Hindi", label: "हिंदी Hindi" },
  { code: "Spanish", label: "🇪🇸 Spanish" },
  { code: "French", label: "🇫🇷 French" },
  { code: "Arabic", label: "🇸🇦 Arabic" },
  { code: "German", label: "🇩🇪 German" },
  { code: "Japanese", label: "🇯🇵 Japanese" },
  { code: "Chinese", label: "🇨🇳 Chinese" },
  { code: "English", label: "🇺🇸 English" },
];

function formatLastSeen(iso?: string): string {
  if (!iso) return "Offline";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Last seen just now";
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `Last seen ${hrs}h ago`;
  return `Last seen ${Math.floor(diff / 86400000)}d ago`;
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
  const [typingInfo, setTypingInfo] = useState<{ senderId: string; senderName?: string } | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);

  // In-chat search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);

  // Translate
  const [showTranslate, setShowTranslate] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Tamil");

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
      setOnlineUsers(Array.isArray(ids) ? ids : []);
      // Update last seen for newly offline users
      setLastSeenMap((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((uid) => {
          if (!ids.includes(uid)) next[uid] = new Date().toISOString();
        });
        return next;
      });
    });

    const addMsg = (data: SocketMessage, groupId?: string) => {
      if (!data?.messageId) return;
      const msg: Message = {
        _id: data.messageId, senderId: data.senderId,
        receiverId: data.receiverId, groupId: groupId || data.groupId,
        message: data.message || "", type: data.type || "text",
        fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize,
        replyTo: data.replyTo, reactions: data.reactions || [],
        status: "delivered", edited: false, deleted: false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.createdAt || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
      socket.emit("message_read", { senderId: data.senderId, receiverId: myId });
    };

    socket.on("receive_message", (data: SocketMessage) => { try { addMsg(data); } catch {} });
    socket.on("receive_group_message", (data: SocketMessage) => { try { addMsg(data, data.groupId); } catch {} });
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
    socket.on("message_edited", (d: any) => { setMessages((p) => p.map((m) => m._id === d.messageId ? { ...m, message: d.message, edited: true } : m)); });
    socket.on("message_deleted", (d: any) => { setMessages((p) => p.map((m) => m._id === d.messageId ? { ...m, deleted: true, message: "This message was deleted" } : m)); });
    socket.on("incoming_call", ({ callerId, callerName, callerImage, callType, offer }: any) => {
      setActiveCall({ type: callType || "video", user: { _id: callerId, name: callerName || "Unknown", image: callerImage || "", email: "", createdAt: "" }, isIncoming: true, offer });
    });

    return () => {
      try {
        ["online_users","receive_message","receive_group_message","message_read",
          "message_delivered","typing","stop_typing","message_reaction",
          "message_edited","message_deleted","incoming_call"
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
    const load = selectedTarget.kind === "user"
      ? fetchMessages(myId, selectedTarget.data._id)
      : fetchGroupMessages(selectedTarget.data._id);
    load.then(setMessages).catch(console.error).finally(() => setLoadingMessages(false));
  }, [myId, selectedTarget]);

  // Search inside chat
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const results = messages.filter((m) =>
      m.message?.toLowerCase().includes(searchQuery.toLowerCase()) && !m.deleted
    );
    setSearchResults(results);
  }, [searchQuery, messages]);

  // Translate all messages
  const handleTranslate = async () => {
    setTranslating(true);
    setShowTranslate(false);
    try {
      const toTranslate = messages.filter((m) => m.type === "text" && m.message && !m.deleted);
      const translated = await Promise.all(
        toTranslate.map(async (m) => {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: m.message, targetLang: selectedLang }),
          });
          const data = await res.json();
          return { id: m._id, translated: data.translated };
        })
      );
      setMessages((prev) => prev.map((m) => {
        const t = translated.find((x) => x.id === m._id);
        return t ? { ...m, message: t.translated } : m;
      }));
    } catch {}
    setTranslating(false);
  };

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
    setReplyTo(null);

    try {
      if (selectedTarget.kind === "user") {
        socket.emit("send_message", { ...optimistic, messageId: optimisticId });
        await postMessage(myId, selectedTarget.data._id, text, { type: extras?.type || "text", ...extras, replyTo: optimistic.replyTo });
      } else {
        socket.emit("send_group_message", { ...optimistic, messageId: optimisticId, groupId: selectedTarget.data._id, senderName: myName, senderImage: myImage });
        await postGroupMessage(selectedTarget.data._id, myId, text, { type: extras?.type || "text", ...extras, replyTo: optimistic.replyTo });
      }
    } catch {}
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

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  if (status === "loading" || !myId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-surface)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const isTyping = !!typingInfo && (
    selectedTarget?.kind === "user" ? typingInfo.senderId === selectedTarget.data._id : true
  );
  const typingLabel = selectedTarget?.kind === "group" && typingInfo?.senderName
    ? `${typingInfo.senderName} is typing…` : "typing…";

  const headerName = selectedTarget?.kind === "user" ? selectedTarget.data.name
    : selectedTarget?.kind === "group" ? selectedTarget.data.name : "";
  const headerImage = selectedTarget?.kind === "user" ? selectedTarget.data.image
    : selectedTarget?.kind === "group" ? selectedTarget.data.avatar : "";
  const isOnline = selectedTarget?.kind === "user" ? onlineUsers.includes(selectedTarget.data._id) : false;
  const lastSeen = selectedTarget?.kind === "user" ? lastSeenMap[selectedTarget.data._id] : undefined;
  const headerSub = selectedTarget?.kind === "group"
    ? `${selectedTarget.data.members.length} members`
    : isTyping ? typingLabel
    : isOnline ? "Online"
    : formatLastSeen(lastSeen);

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "var(--bg-surface)" }}>
      {/* Sidebar */}
      <div className={`flex-shrink-0 md:w-72 md:flex md:flex-col ${showSidebar ? "flex flex-col w-full absolute inset-0 z-20 md:relative md:z-auto" : "hidden md:flex md:flex-col"}`}>
        <Sidebar
          currentUser={session!.user as any}
          users={users} groups={groups}
          selectedTarget={selectedTarget}
          onlineUsers={onlineUsers}
          lastSeenMap={lastSeenMap}
          onSelectTarget={(t) => { setSelectedTarget(t); setReplyTo(null); setEditingMsg(null); setShowSidebar(false); setShowSearch(false); }}
          onGroupCreated={(g) => setGroups((p) => [g, ...p])}
          onCallUser={(user, type) => setActiveCall({ type, user, isIncoming: false })}
          onOpenAI={() => setShowAI(true)}
        />
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!showSidebar ? "flex" : "hidden md:flex"}`}>
        {selectedTarget ? (
          <>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex-shrink-0" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--bg-border)" }}>
              <div className="h-16 flex items-center gap-3 px-4">
                {/* Back (mobile) */}
                <button onClick={() => { setShowSidebar(true); setSelectedTarget(null); setShowSearch(false); }}
                  className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                  style={{ color: "var(--text-secondary)" }}>
                  <Icons.Back />
                </button>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {headerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={headerImage} alt={headerName} className="w-10 h-10 rounded-full object-cover"
                      style={{ border: "2px solid var(--bg-border)" }} />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))" }}>
                      {selectedTarget.kind === "group" ? "G" : headerName[0]}
                    </div>
                  )}
                  {selectedTarget.kind === "user" && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ background: isOnline ? "var(--brand)" : "var(--text-muted)", borderColor: "var(--bg-card)" }} />
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: "var(--text-primary)", fontSize: 15 }}>{headerName}</p>
                  <p className="text-xs truncate" style={{ color: isTyping ? "var(--brand)" : "var(--text-muted)" }}>{headerSub}</p>
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Search in chat */}
                  <button onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                    style={{ color: showSearch ? "var(--brand)" : "var(--text-muted)", background: showSearch ? "var(--brand-glow)" : "transparent" }}>
                    <Icons.Search />
                  </button>

                  {/* Translate */}
                  {selectedTarget.kind === "user" && (
                    <button onClick={() => setShowTranslate(!showTranslate)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                      <Icons.Translate />
                    </button>
                  )}

                  {/* Call buttons (1-to-1 only) */}
                  {selectedTarget.kind === "user" && (
                    <>
                      <button onClick={() => setActiveCall({ type: "voice", user: selectedTarget.data, isIncoming: false })}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                        <Icons.Phone />
                      </button>
                      <button onClick={() => setActiveCall({ type: "video", user: selectedTarget.data, isIncoming: false })}
                        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#60a5fa"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                        <Icons.Video />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Search bar */}
              {showSearch && (
                <div className="px-4 pb-3 animate-slide-up">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "var(--bg-raised)", border: "1.5px solid var(--bg-border)" }}>
                    <Icons.Search />
                    <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search in conversation…"
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: "var(--text-primary)", caretColor: "var(--brand)" }} />
                    {searchQuery && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--brand-glow)", color: "var(--brand)" }}>
                        {searchResults.length} found
                      </span>
                    )}
                    <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} style={{ color: "var(--text-muted)" }}>
                      <Icons.Close />
                    </button>
                  </div>
                </div>
              )}

              {/* Translate picker */}
              {showTranslate && (
                <div className="px-4 pb-3 animate-slide-up">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Translate to:</span>
                    {LANGUAGES.map((lang) => (
                      <button key={lang.code} onClick={() => setSelectedLang(lang.code)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: selectedLang === lang.code ? "var(--brand)" : "var(--bg-raised)",
                          color: selectedLang === lang.code ? "#fff" : "var(--text-secondary)",
                          border: `1px solid ${selectedLang === lang.code ? "var(--brand)" : "var(--bg-border)"}`,
                        }}>
                        {lang.label}
                      </button>
                    ))}
                    <button onClick={handleTranslate} disabled={translating}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))", color: "#fff" }}>
                      {translating ? "Translating…" : "Translate All"}
                    </button>
                    <button onClick={() => setShowTranslate(false)} style={{ color: "var(--text-muted)" }}>
                      <Icons.Close />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ChatWindow
              messages={messages} myId={myId} loading={loadingMessages}
              isTyping={isTyping} typingLabel={typingLabel}
              partnerName={headerName}
              searchQuery={searchQuery}
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
          <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center animate-glow"
                style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))" }}>
                <svg width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Welcome to PulseChat</p>
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Video/Voice call */}
      {activeCall && myId && (
        <VideoCallModal
          callType={activeCall.type} targetUser={activeCall.user}
          myId={myId} myName={myName || ""} myImage={myImage}
          isIncoming={activeCall.isIncoming} offer={activeCall.offer}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {/* AI Chatbot */}
      {showAI && <AIChatbot onClose={() => setShowAI(false)} />}
    </div>
  );
}
