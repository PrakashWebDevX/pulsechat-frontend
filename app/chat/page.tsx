"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { User, Message, SocketMessage } from "@/types";
import { fetchUsers, fetchMessages, postMessage } from "@/lib/api";
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

  const myId = (session?.user as any)?.id as string | undefined;

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;

    const socket = connectSocket(myId);

    socket.on("online_users", (ids: string[]) => setOnlineUsers(ids));

    socket.on("receive_message", (data: SocketMessage) => {
      const msg: Message = {
        _id: data.messageId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
        createdAt: data.createdAt,
      };
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", ({ senderId }: { senderId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(senderId));
    });

    socket.on("stop_typing", ({ senderId }: { senderId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    });

    return () => {
      socket.off("online_users");
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
      disconnectSocket();
    };
  }, [myId]);

  // ── Load user list ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    fetchUsers(myId).then(setUsers).catch(console.error);
  }, [myId]);

  // ── Load messages when chat partner changes ───────────────────────────────
  useEffect(() => {
    if (!myId || !selectedUser) return;
    setLoadingMessages(true);
    fetchMessages(myId, selectedUser._id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [myId, selectedUser]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      if (!myId || !selectedUser || !text.trim()) return;

      const socket = getSocket();
      const createdAt = new Date().toISOString();
      const optimisticId = `optimistic-${Date.now()}`;

      // Optimistic UI update
      const optimistic: Message = {
        _id: optimisticId,
        senderId: myId,
        receiverId: selectedUser._id,
        message: text.trim(),
        createdAt,
      };
      setMessages((prev) => [...prev, optimistic]);

      // Emit via socket for instant delivery to receiver
      socket.emit("send_message", {
        messageId: optimisticId,
        senderId: myId,
        receiverId: selectedUser._id,
        message: text.trim(),
        createdAt,
      });

      // Persist in DB (fire-and-forget, replace optimistic id if needed)
      try {
        await postMessage(myId, selectedUser._id, text.trim());
      } catch (err) {
        console.error("Failed to persist message:", err);
      }
    },
    [myId, selectedUser]
  );

  // ── Typing events ─────────────────────────────────────────────────────────
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!myId || !selectedUser) return;
      const socket = getSocket();
      socket.emit(isTyping ? "typing" : "stop_typing", {
        senderId: myId,
        receiverId: selectedUser._id,
      });
    },
    [myId, selectedUser]
  );

  if (status === "loading" || !myId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPartnerTyping = selectedUser
    ? typingUsers.has(selectedUser._id)
    : false;

  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentUser={session!.user as any}
        users={users}
        selectedUser={selectedUser}
        onlineUsers={onlineUsers}
        onSelectUser={setSelectedUser}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="h-16 border-b border-surface-border flex items-center gap-3 px-5 bg-surface-card flex-shrink-0">
              <div className="relative">
                {selectedUser.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedUser.image}
                    alt={selectedUser.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 font-semibold text-sm">
                    {selectedUser.name[0]}
                  </div>
                )}
                {onlineUsers.includes(selectedUser._id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-500 border-2 border-surface-card rounded-full" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white leading-tight">
                  {selectedUser.name}
                </span>
                <span className="text-xs text-gray-500">
                  {isPartnerTyping
                    ? "typing…"
                    : onlineUsers.includes(selectedUser._id)
                    ? "Online"
                    : "Offline"}
                </span>
              </div>
            </div>

            <ChatWindow
              messages={messages}
              myId={myId}
              loading={loadingMessages}
              isTyping={isPartnerTyping}
              partnerName={selectedUser.name}
            />

            <MessageInput onSend={handleSend} onTyping={handleTyping} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 bg-surface-raised border border-surface-border rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Select a conversation</p>
              <p className="text-gray-500 text-sm mt-1">
                Choose someone from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
