"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/types";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: Message[];
  myId: string;
  loading: boolean;
  isTyping: boolean;
  partnerName: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (messageId: string) => void;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function ChatWindow({ messages, myId, loading, isTyping, partnerName, onReact, onReply, onEdit, onDelete }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
    <div className="flex-1 overflow-y-auto px-5 py-4 bg-surface">
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            Say hi to <span className="text-white">{partnerName}</span>!
          </p>
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
            const isGrouped =
              prevMsg &&
              prevMsg.senderId === msg.senderId &&
              new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 60_000;

            return (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isMine={msg.senderId === myId}
                isGrouped={!!isGrouped}
                myId={myId}
                onReact={onReact}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start mt-3 animate-fade-in">
          <div className="bg-surface-raised rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
