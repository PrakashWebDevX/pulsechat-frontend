"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { User, Message, SocketMessage } from "@/types";
import { fetchUsers, fetchMessages, postMessage, editMessage, deleteMessage, reactToMessage } from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  // Mobile: show sidebar or chat
  const [showSidebar, setShowSidebar] = useState(true);

  const myId = (session?.user as any)?.id as string | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Socket setup — wrapped in try/catch to prevent client-side crash
  useEffect(() => {
    if (!myId) return;

    let socket: ReturnType<typeof connectSocket>;
    try {
      socket = connectSocket(myId);
    } catch (err) {
      console.error("Socket connection failed:", err);
      return;
    }

    socket.on("online_users", (ids: string[]) => {
      try { setOnlineUsers(Array.isArray(ids) ? ids : []); } catch {}
    });

    socket.on("receive_message", (data: SocketMessage) => {
      try {
        if (!data?.messageId) return;
        const msg: Message = {
          _id: data.messageId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message || "",
          type: data.type || "text",
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          replyTo: data.replyTo,
          reactions: Array.isArray(data.reactions) ? data.reactions : [],
          status: "delivered",
          edited: false,
          deleted: false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.createdAt || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        socket.emit("message_read", { senderId: data.senderId, receiverId: myId });
      } catch (err) {
        console.error("receive_message error:", err);
      }
    });

    socket.on("message_read", ({ receiverId }: { receiverId: string }) => {
      try {
        setMessages((prev) =>
          prev.map((m) => m.receiverId === receiverId && m.status !== "read" ? { ...m, status: "read" as const } : m)
        );
      } catch {}
    });

    socket.on("message_delivered", ({ messageId }: { messageId: string }) => {
      try {
        setMessages((prev) =>
          prev.map((m) => m._id === messageId && m.status === "sent" ? { ...m, status: "delivered" as const } : m)
        );
      } catch {}
    });

    socket.on("typing", ({ senderId }: { senderId: string }) => {
      try { setTypingUsers((prev) => new Set(prev).add(senderId)); } catch {}
    });

    socket.on("stop_typing", ({ senderId }: { senderId: string }) => {
      try {
        setTypingUsers((prev) => { const n = new Set(prev); n.delete(senderId); return n; });
      } catch {}
    });

    socket.on("message_reaction", (data: { messageId: string; userId: string; emoji: string }) => {
      try {
        if (!data?.messageId) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (m._id !== data.messageId) return m;
            const reactions = [...(m.reactions || [])];
            const idx = reactions.findIndex((r) => r.userId === data.userId);
            if (idx !== -1) {
              if (reactions[idx].emoji === data.emoji) reactions.splice(idx, 1);
              else reactions[idx] = { ...reactions[idx], emoji: data.emoji };
            } else {
              reactions.push({ userId: data.userId, emoji: data.emoji });
            }
            return { ...m, reactions };
          })
        );
      } catch {}
    });

    socket.on("message_edited", (data: { messageId: string; message: string }) => {
      try {
        setMessages((prev) =>
          prev.map((m) => m._id === data.messageId ? { ...m, message: data.message, edited: true } : m)
        );
      } catch {}
    });

    socket.on("message_deleted", (data: { messageId: string }) => {
      try {
        setMessages((prev) =>
          prev.map((m) => m._id === data.messageId ? { ...m, deleted: true, message: "This message was deleted" } : m)
        );
      } catch {}
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
    });

    return () => {
      try {
        socket.off("online_users");
        socket.off("receive_message");
        socket.off("message_read");
        socket.off("message_delivered");
        socket.off("typing");
        socket.off("stop_typing");
        socket.off("message_reaction");
        socket.off("message_edited");
        socket.off("message_deleted");
        socket.off("connect_error");
        disconnectSocket();
      } catch {}
    };
  }, [myId]);

  useEffect(() => {
    if (!myId) return;
    fetchUsers(myId).then(setUsers).catch(console.error);
  }, [myId]);

  useEffect(() => {
    if (!myId || !selectedUser) return;
    setLoadingMessages(true);
    fetchMessages(myId, selectedUser._id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [myId, selectedUser]);

  const handleSend = useCallback(
    async (text: string, extras?: { type?: "image" | "file"; fileUrl?: string; fileName?: string; fileSize?: number }) => {
      if (!myId || !selectedUser) return;
      const socket = getSocket();
      const createdAt = new Date().toISOString();
      const optimisticId = `optimistic-${Date.now()}`;

      const optimistic: Message = {
        _id: optimisticId,
        senderId: myId,
        receiverId: selectedUser._id,
        message: text || "",
        type: extras?.type || "text",
        fileUrl: extras?.fileUrl,
        fileName: extras?.fileName,
        fileSize: extras?.fileSize,
        replyTo: replyTo
          ? { _id: replyTo._id, message: replyTo.message, senderId: replyTo.senderId, type: replyTo.type }
          : undefined,
        reactions: [],
        status: "sent",
        edited: false,
        deleted: false,
        createdAt,
        updatedAt: createdAt,
      };

      setMessages((prev) => [...prev, optimistic]);
      setReplyTo(null);

      try {
        socket.emit("send_message", {
          messageId: optimisticId,
          senderId: myId,
          receiverId: selectedUser._id,
          message: text || "",
          type: extras?.type || "text",
          fileUrl: extras?.fileUrl,
          fileName: extras?.fileName,
          fileSize: extras?.fileSize,
          replyTo: optimistic.replyTo,
          reactions: [],
          status: "sent",
          edited: false,
          deleted: false,
          createdAt,
        });

        await postMessage(myId, selectedUser._id, text, {
          type: extras?.type || "text",
          fileUrl: extras?.fileUrl,
          fileName: extras?.fileName,
          fileSize: extras?.fileSize,
          replyTo: optimistic.replyTo,
        });
      } catch (err) {
        console.error("Send failed:", err);
      }
    },
    [myId, selectedUser, replyTo]
  );

  const handleReact = useCallback(
    async (messageId: string, emoji: string) => {
      if (!myId || !selectedUser) return;
      try {
        const socket = getSocket();
        setMessages((prev) =>
          prev.map((m) => {
            if (m._id !== messageId) return m;
            const reactions = [...(m.reactions || [])];
            const idx = reactions.findIndex((r) => r.userId === myId);
            if (idx !== -1) {
              if (reactions[idx].emoji === emoji) reactions.splice(idx, 1);
              else reactions[idx] = { userId: myId, emoji };
            } else {
              reactions.push({ userId: myId, emoji });
            }
            return { ...m, reactions };
          })
        );
        socket.emit("message_reaction", { messageId, userId: myId, emoji, senderId: myId, receiverId: selectedUser._id });
        await reactToMessage(messageId, myId, emoji);
      } catch {}
    },
    [myId, selectedUser]
  );

  const handleEditSave = useCallback(
    async (messageId: string, newText: string) => {
      if (!myId || !selectedUser) return;
      try {
        const socket = getSocket();
        setMessages((prev) =>
          prev.map((m) => m._id === messageId ? { ...m, message: newText, edited: true } : m)
        );
        socket.emit("message_edit", { messageId, message: newText, senderId: myId, receiverId: selectedUser._id });
        await editMessage(messageId, newText);
      } catch {}
    },
    [myId, selectedUser]
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      if (!myId || !selectedUser) return;
      try {
        const socket = getSocket();
        setMessages((prev) =>
          prev.map((m) => m._id === messageId ? { ...m, deleted: true, message: "This message was deleted" } : m)
        );
        socket.emit("message_delete", { messageId, senderId: myId, receiverId: selectedUser._id });
        await deleteMessage(messageId);
      } catch {}
    },
    [myId, selectedUser]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!myId || !selectedUser) return;
      try {
        getSocket().emit(isTyping ? "typing" : "stop_typing", { senderId: myId, receiverId: selectedUser._id });
      } catch {}
    },
    [myId, selectedUser]
  );

  const handleSelectUser = useCallback((u: User) => {
    setSelectedUser(u);
    setReplyTo(null);
    setEditingMsg(null);
    setShowSidebar(false); // Mobile: switch to chat view
  }, []);

  const handleBackToSidebar = useCallback(() => {
    setShowSidebar(true);
    setSelectedUser(null);
  }, []);

  if (status === "loading" || !myId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPartnerTyping = selectedUser ? typingUsers.has(selectedUser._id) : false;

  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      {/* ── SIDEBAR ─────────────────────────────────────────────────────────
           Desktop: always visible (w-72)
           Mobile: full screen when showSidebar=true, hidden otherwise      */}
      <div className={`
        flex-shrink-0 
        md:w-72 md:flex md:flex-col
        ${showSidebar ? "flex flex-col w-full absolute inset-0 z-20 md:relative md:z-auto" : "hidden md:flex md:flex-col"}
      `}>
        <Sidebar
          currentUser={session!.user as any}
          users={users}
          selectedUser={selectedUser}
          onlineUsers={onlineUsers}
          onSelectUser={handleSelectUser}
        />
      </div>

      {/* ── CHAT AREA ────────────────────────────────────────────────────────
           Desktop: always visible
           Mobile: shown when showSidebar=false                              */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${!showSidebar ? "flex" : "hidden md:flex"}
      `}>
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="h-16 border-b border-surface-border flex items-center gap-3 px-4 bg-surface-card flex-shrink-0">
              {/* Back button — mobile only */}
              <button
                onClick={handleBackToSidebar}
                className="md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="relative flex-shrink-0">
                {selectedUser.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedUser.image} alt={selectedUser.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 font-semibold text-sm">
                    {selectedUser.name[0]}
                  </div>
                )}
                {onlineUsers.includes(selectedUser._id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-500 border-2 border-surface-card rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{selectedUser.name}</p>
                <p className="text-xs text-gray-500">
                  {isPartnerTyping ? "typing…" : onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <ChatWindow
              messages={messages}
              myId={myId}
              loading={loadingMessages}
              isTyping={isPartnerTyping}
              partnerName={selectedUser.name}
              onReact={handleReact}
              onReply={setReplyTo}
              onEdit={setEditingMsg}
              onDelete={handleDelete}
            />

            <MessageInput
              onSend={handleSend}
              onTyping={handleTyping}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              editingMsg={editingMsg}
              onCancelEdit={() => setEditingMsg(null)}
              onEditSave={handleEditSave}
              myId={myId}
            />
          </>
        ) : (
          // Desktop empty state
          <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 bg-surface-raised border border-surface-border rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Select a conversation</p>
              <p className="text-gray-500 text-sm mt-1">Choose someone from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
