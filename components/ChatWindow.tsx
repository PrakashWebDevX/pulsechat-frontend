"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/types";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: Message[];
  myId: string;
  loading: boolean;
  isTyping: boolean;
  typingLabel?: string;
  partnerName: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (messageId: string) => void;
}

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch { return ""; }
}

export default function ChatWindow({ messages, myId, loading, isTyping, typingLabel, partnerName, onReact, onReply, onEdit, onDelete }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const groups: { label: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.msgs.push(msg);
    else groups.push({ label, msgs: [msg] });
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 bg-surface">
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center text-2xl">💬</div>
          <p className="text-sm text-gray-500">Say hi to <span className="text-white">{partnerName}</span>!</p>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-gray-600 font-medium">{group.label}</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>
          {group.msgs.map((msg, i) => {
            const prevMsg = group.msgs[i - 1];
            const isMine = String(msg.senderId) === myId || (typeof msg.senderId === "object" && (msg.senderId as any)?._id === myId);
            const prevSenderId = prevMsg ? String(typeof prevMsg.senderId === "object" ? (prevMsg.senderId as any)?._id : prevMsg.senderId) : null;
            const currSenderId = String(typeof msg.senderId === "object" ? (msg.senderId as any)?._id : msg.senderId);
            const isGrouped = prevMsg && prevSenderId === currSenderId && new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 60_000;

            // For group messages, show sender name/avatar
            const senderName = typeof msg.senderId === "object" ? (msg.senderId as any)?.name : undefined;
            const senderImage = typeof msg.senderId === "object" ? (msg.senderId as any)?.image : undefined;

            return (
              <div key={msg._id}>
                {/* Group sender label */}
                {!isMine && msg.groupId && !isGrouped && (
                  <div className="flex items-center gap-2 mt-3 mb-0.5 ml-1">
                    {senderImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={senderImage} alt={senderName} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-surface-raised flex items-center justify-center text-xs text-gray-400">
                        {senderName?.[0] || "?"}
                      </div>
                    )}
                    <span className="text-xs text-gray-400 font-medium">{senderName}</span>
                  </div>
                )}
                <MessageBubble
                  key={msg._id} msg={msg}
                  isMine={isMine}
                  isGrouped={!!isGrouped}
                  myId={myId}
                  onReact={onReact} onReply={onReply}
                  onEdit={onEdit} onDelete={onDelete}
                />
              </div>
            );
          })}
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start mt-3 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl rounded-bl-sm px-4 py-3">
            {typingLabel && typingLabel !== "typing…" && (
              <p className="text-xs text-brand-500 mb-1">{typingLabel}</p>
            )}
            <div className="flex items-center gap-1">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
