"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/types";
import MessageBubble from "./MessageBubble";
import { useTheme } from "@/lib/ThemeContext";

interface Props {
  messages: Message[];
  myId: string;
  loading: boolean;
  isTyping: boolean;
  typingLabel?: string;
  partnerName: string;
  searchQuery?: string;
  onReact: (id: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (id: string) => void;
}

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

function SkeletonMsg({ isMine }: { isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 mb-2`}>
      <div className="shimmer rounded-lg" style={{ width: `${100 + Math.random() * 120}px`, height: 38 }} />
    </div>
  );
}

export default function ChatWindow({
  messages, myId, loading, isTyping, typingLabel, partnerName,
  searchQuery, onReact, onReply, onEdit, onDelete,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { theme, wallpaper } = useTheme();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Build wallpaper class
  const wallpaperClass = `wallpaper-${wallpaper}-${theme}`;

  if (loading) {
    return (
      <div className={`flex-1 overflow-y-auto py-4 ${wallpaperClass}`}>
        {[...Array(8)].map((_, i) => <SkeletonMsg key={i} isMine={i % 3 === 0} />)}
      </div>
    );
  }

  const groups: { label: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.msgs.push(msg);
    else groups.push({ label, msgs: [msg] });
  }

  return (
    <div className={`flex-1 overflow-y-auto py-3 ${wallpaperClass}`}>
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="px-6 py-3 rounded-full text-sm"
            style={{ background: "var(--bg-header)", color: "var(--text-secondary)" }}>
            🔒 Messages are end-to-end encrypted
          </div>
          <div className="px-6 py-3 rounded-full text-sm"
            style={{ background: "var(--bg-header)", color: "var(--text-secondary)" }}>
            Say hi to <span style={{ color: "var(--brand)" }}>{partnerName}</span>! 👋
          </div>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <div className="flex justify-center my-4">
            <span className="px-4 py-1 rounded-full text-xs font-medium shadow-sm"
              style={{ background: "var(--bg-header)", color: "var(--text-secondary)" }}>
              {group.label}
            </span>
          </div>

          {group.msgs.map((msg, i) => {
            const prevMsg = group.msgs[i - 1];
            const isMine = String(msg.senderId) === myId ||
              (typeof msg.senderId === "object" && (msg.senderId as any)?._id === myId);
            const prevSenderId = prevMsg
              ? String(typeof prevMsg.senderId === "object" ? (prevMsg.senderId as any)?._id : prevMsg.senderId)
              : null;
            const currSenderId = String(typeof msg.senderId === "object" ? (msg.senderId as any)?._id : msg.senderId);
            const isGrouped = !!prevMsg && prevSenderId === currSenderId &&
              new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 60000;

            const senderName = typeof msg.senderId === "object" ? (msg.senderId as any)?.name : undefined;
            const senderImage = typeof msg.senderId === "object" ? (msg.senderId as any)?.image : undefined;

            const isHighlighted = searchQuery &&
              msg.message?.toLowerCase().includes(searchQuery.toLowerCase()) && !msg.deleted;

            return (
              <div key={msg._id}
                style={isHighlighted ? { background: "rgba(0,168,132,0.1)", borderRadius: 4 } : {}}>
                {!isMine && msg.groupId && !isGrouped && (
                  <div className="flex items-center gap-2 pl-4 mt-2 mb-0.5">
                    {senderImage
                      ? <img src={senderImage} alt="" className="w-5 h-5 rounded-full object-cover" />
                      : <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "var(--brand)" }}>{senderName?.[0] || "?"}</div>}
                    <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>{senderName}</span>
                  </div>
                )}
                <MessageBubble
                  msg={msg} isMine={isMine} isGrouped={!!isGrouped} myId={myId}
                  onReact={onReact} onReply={onReply} onEdit={onEdit} onDelete={onDelete}
                />
              </div>
            );
          })}
        </div>
      ))}

      {isTyping && (
        <div className="flex items-end gap-2 px-4 mt-2 animate-fade-in">
          <div className="px-4 py-3 rounded-lg rounded-bl-none shadow-sm"
            style={{ background: "var(--bg-bubble-in)" }}>
            {typingLabel && typingLabel !== "typing…" && (
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--brand)" }}>{typingLabel}</p>
            )}
            <div className="flex items-center gap-1 h-4">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
