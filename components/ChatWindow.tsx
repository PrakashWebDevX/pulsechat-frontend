"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/types";
import MessageBubble from "./MessageBubble";

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
    return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  } catch { return ""; }
}

// Skeleton loading bubble
function SkeletonBubble({ isMine }: { isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}>
      <div className="shimmer rounded-2xl" style={{ width: `${120 + Math.random() * 80}px`, height: 40 }} />
    </div>
  );
}

export default function ChatWindow({
  messages, myId, loading, isTyping, typingLabel, partnerName,
  searchQuery, onReact, onReply, onEdit, onDelete,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Highlight searched message
  useEffect(() => {
    if (searchQuery) {
      const found = messages.find((m) =>
        m.message?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (found) {
        setHighlightedId(found._id);
        setTimeout(() => setHighlightedId(null), 2000);
      }
    }
  }, [searchQuery, messages]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "var(--bg-surface)" }}>
        {[...Array(6)].map((_, i) => (
          <SkeletonBubble key={i} isMine={i % 3 === 0} />
        ))}
      </div>
    );
  }

  // Group by date
  const groups: { label: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.msgs.push(msg);
    else groups.push({ label, msgs: [msg] });
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3" style={{ background: "var(--bg-surface)" }}>
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--bg-border)" }}>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: "var(--text-muted)" }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Start a conversation
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Say hello to <span style={{ color: "var(--brand)" }}>{partnerName}</span>! 👋
            </p>
          </div>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          {/* Date separator */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "var(--bg-border)" }} />
            <span className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
              {group.label}
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--bg-border)" }} />
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

            const isHighlighted = highlightedId === msg._id;

            return (
              <div key={msg._id}
                className="transition-all duration-500"
                style={isHighlighted ? {
                  background: "var(--brand-glow)",
                  borderRadius: 12,
                  padding: "2px 4px",
                  margin: "-2px -4px",
                } : {}}>
                {/* Group sender label */}
                {!isMine && msg.groupId && !isGrouped && (
                  <div className="flex items-center gap-2 mt-3 mb-1 ml-1">
                    {senderImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={senderImage} alt={senderName} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "var(--brand)", color: "#fff" }}>
                        {senderName?.[0] || "?"}
                      </div>
                    )}
                    <span className="text-xs font-semibold" style={{ color: "var(--brand)" }}>{senderName}</span>
                  </div>
                )}

                <MessageBubble
                  msg={msg}
                  isMine={isMine}
                  isGrouped={!!isGrouped}
                  myId={myId}
                  onReact={onReact}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex items-center gap-2 mt-3 animate-fade-in">
          <div className="px-4 py-3 rounded-2xl rounded-bl-sm"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--bg-border)" }}>
            {typingLabel && typingLabel !== "typing…" && (
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--brand)" }}>{typingLabel}</p>
            )}
            <div className="flex items-center gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
