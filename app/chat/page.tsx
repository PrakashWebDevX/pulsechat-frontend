"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { User, Group, Message, SocketMessage, ChatTarget } from "@/types";
import {
  fetchUsers, fetchMessages, postMessage, editMessage,
  deleteMessage, reactToMessage, fetchGroups, fetchGroupMessages,
  postGroupMessage,
} from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";
import VideoCallModal from "@/components/VideoCallModal";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<ChatTarget | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingInfo, setTypingInfo] = useState<{ senderId: string; senderName?: string } | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Call state
  const [activeCall, setActiveCall] = useState<{
    type: "video" | "voice";
    user: User;
    isIncoming: boolean;
    offer?: RTCSessionDescriptionInit;
  } | null>(null);

  const myId = (session?.user as any)?.id as string | undefined;
  const myName = (session?.user as any)?.name as string | undefined;
  const myImage = (session?.user as any)?.image as string | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Socket setup
  useEffect(() => {
    if (!myId) return;
    let socket: ReturnType<typeof connectSocket>;
    try { socket = connectSocket(myId); } catch { return; }

    socket.on("online_users", (ids: string[]) => setOnlineUsers(Array.isArray(ids) ? ids : []));

    socket.on("receive_message", (data: SocketMessage) => {
      try {
        if (!data?.messageId) return;
        const msg: Message = {
          _id: data.messageId, senderId: data.senderId, receiverId: data.receiverId,
          message: data.message || "", type: data.type || "text",
          fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize,
          replyTo: data.replyTo, reactions: data.reactions || [],
          status: "delivered", edited: false, deleted: false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.createdAt || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        socket.emit("message_read", { senderId: data.senderId, receiverId: myId });
      } catch {}
    });

    socket.on("receive_group_message", (data: SocketMessage) => {
      try {
        if (!data?.messageId) return;
        const msg: Message = {
          _id: data.messageId, senderId: data.senderId, groupId: data.groupId,
          message: data.message || "", type: data.type || "text",
          fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize,
          replyTo: data.replyTo, reactions: data.reactions || [],
          status: "delivered", edited: false, deleted: false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.createdAt || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
      } catch {}
    });

    socket.on("message_read", ({ receiverId }: any) => {
      try { setMessages((prev) => prev.map((m) => m.receiverId === receiverId && m.status !== "read" ? { ...m, status: "read" as const } : m)); } catch {}
    });
    socket.on("message_delivered", ({ messageId }: any) => {
      try { setMessages((prev) => prev.map((m) => m._id === messageId && m.status === "sent" ? { ...m, status: "delivered" as const } : m)); } catch {}
    });
    socket.on("typing", (data: any) => { try { setTypingInfo({ senderId: data.senderId, senderName: data.senderName }); } catch {} });
    socket.on("stop_typing", () => { try { setTypingInfo(null); } catch {} });

    socket.on("message_reaction", (data: any) => {
      try {
        setMessages((prev) => prev.map((m) => {
          if (m._id !== data.messageId) return m;
          const reactions = [...(m.reactions || [])];
          const idx = reactions.findIndex((r) => r.userId === data.userId);
          if (idx !== -1) { if (reactions[idx].emoji === data.emoji) reactions.splice(idx, 1); else reactions[idx] = { ...reactions[idx], emoji: data.emoji }; }
          else reactions.push({ userId: data.userId, emoji: data.emoji });
          return { ...m, reactions };
        }));
      } catch {}
    });
    socket.on("message_edited", (data: any) => {
      try { setMessages((prev) => prev.map((m) => m._id === data.messageId ? { ...m, message: data.message, edited: true } : m)); } catch {}
    });
    socket.on("message_deleted", (data: any) => {
      try { setMessages((prev) => prev.map((m) => m._id === data.messageId ? { ...m, deleted: true, message: "This message was deleted" } : m)); } catch {}
    });

    // ── Incoming call ────────────────────────────────────────────────────────
    socket.on("incoming_call", ({ callerId, callerName, callerImage, callType, offer }: any) => {
      try {
        const callerUser: User = {
          _id: callerId, name: callerName || "Unknown",
          email: "", image: callerImage || "", createdAt: "",
        };
        setActiveCall({ type: callType || "video", user: callerUser, isIncoming: true, offer });
      } catch {}
    });

    socket.on("call_failed", () => { try { setActiveCall(null); } catch {} });

    return () => {
      try {
        ["online_users","receive_message","receive_group_message","message_read",
         "message_delivered","typing","stop_typing","message_reaction",
         "message_edited","message_deleted","incoming_call","call_failed"
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

  const handleSend = useCallback(async (text: string, extras?: any) => {
    if (!myId || !selectedTarget) return;
    const socket = getSocket();
    const createdAt = new Date().toISOString();
    const optimisticId = `optimistic-${Date.now()}`;

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

    setMessages((prev) => [...prev, optimistic]);
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
      setMessages((prev) => prev.map((m) => {
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
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, message: newText, edited: true } : m));
      const extra = selectedTarget.kind === "group" ? { groupId: selectedTarget.data._id } : { receiverId: selectedTarget.data._id };
      socket.emit("message_edit", { messageId, message: newText, senderId: myId, ...extra });
      await editMessage(messageId, newText);
    } catch {}
  }, [myId, selectedTarget]);

  const handleDelete = useCallback(async (messageId: string) => {
    if (!myId || !selectedTarget) return;
    try {
      const socket = getSocket();
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, deleted: true, message: "This message was deleted" } : m));
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

  const handleSelectTarget = useCallback((target: ChatTarget) => {
    setSelectedTarget(target);
    setReplyTo(null);
    setEditingMsg(null);
    setShowSidebar(false);
  }, []);

  // ── Call handlers ────────────────────────────────────────────────────────
  const handleCallUser = useCallback((user: User, type: "video" | "voice") => {
    setActiveCall({ type, user, isIncoming: false });
  }, []);

  if (status === "loading" || !myId) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const isTyping = !!typingInfo && (
    selectedTarget?.kind === "user" ? typingInfo.senderId === selectedTarget.data._id : true
  );
  const typingLabel = selectedTarget?.kind === "group" && typingInfo?.senderName
    ? `${typingInfo.senderName} is typing…` : "typing…";

  const headerName = selectedTarget?.kind === "user" ? selectedTarget.data.name : selectedTarget?.kind === "group" ? selectedTarget.data.name : "";
  const headerImage = selectedTarget?.kind === "user" ? selectedTarget.data.image : selectedTarget?.kind === "group" ? selectedTarget.data.avatar : "";
  const isOnline = selectedTarget?.kind === "user" ? onlineUsers.includes(selectedTarget.data._id) : false;
  const headerSub = selectedTarget?.kind === "group"
    ? `${selectedTarget.data.members.length} members`
    : isTyping ? typingLabel
    : isOnline ? "Online" : "Offline";

  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      {/* Sidebar */}
      <div className={`flex-shrink-0 md:w-72 md:flex md:flex-col ${showSidebar ? "flex flex-col w-full absolute inset-0 z-20 md:relative md:z-auto" : "hidden md:flex md:flex-col"}`}>
        <Sidebar
          currentUser={session!.user as any}
          users={users}
          groups={groups}
          selectedTarget={selectedTarget}
          onlineUsers={onlineUsers}
          onSelectTarget={handleSelectTarget}
          onGroupCreated={(g) => setGroups((prev) => [g, ...prev])}
          onCallUser={handleCallUser}
        />
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!showSidebar ? "flex" : "hidden md:flex"}`}>
        {selectedTarget ? (
          <>
            {/* ── Chat Header ─────────────────────────────────────────────── */}
            <div className="h-16 border-b border-surface-border flex items-center gap-3 px-4 bg-surface-card flex-shrink-0">
              {/* Back button - mobile */}
              <button onClick={() => { setShowSidebar(true); setSelectedTarget(null); }}
                className="md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {headerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={headerImage} alt={headerName} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 font-semibold text-sm">
                    {selectedTarget.kind === "group" ? "👥" : headerName[0]}
                  </div>
                )}
                {selectedTarget.kind === "user" && isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-500 border-2 border-surface-card rounded-full" />
                )}
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{headerName}</p>
                <p className={`text-xs truncate ${isTyping ? "text-brand-500" : "text-gray-500"}`}>{headerSub}</p>
              </div>

              {/* ── Call buttons (always visible for 1-to-1 chats) ─────── */}
              {selectedTarget.kind === "user" && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Voice call */}
                  <button
                    onClick={() => handleCallUser(selectedTarget.data, "voice")}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 transition-all"
                    title="Voice call"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  {/* Video call */}
                  <button
                    onClick={() => handleCallUser(selectedTarget.data, "video")}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                    title="Video call"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <ChatWindow
              messages={messages} myId={myId} loading={loadingMessages}
              isTyping={isTyping} typingLabel={typingLabel}
              partnerName={headerName}
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
          <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 bg-surface-raised border border-surface-border rounded-2xl flex items-center justify-center text-3xl">💬</div>
            <div>
              <p className="text-white font-medium">Select a conversation</p>
              <p className="text-gray-500 text-sm mt-1">Choose a person or group to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Video / Voice Call Modal ─────────────────────────────────────── */}
      {activeCall && myId && (
        <VideoCallModal
          callType={activeCall.type}
          targetUser={activeCall.user}
          myId={myId}
          myName={myName || ""}
          myImage={myImage}
          isIncoming={activeCall.isIncoming}
          offer={activeCall.offer}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}