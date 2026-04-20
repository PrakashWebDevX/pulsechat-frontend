"use client";

import { useState, useRef } from "react";
import { Message } from "@/types";
import { QUICK_REACTIONS } from "./EmojiPicker";
import AudioMessage from "./AudioMessage";

interface Props {
  msg: Message;
  isMine: boolean;
  isGrouped: boolean;
  myId: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (messageId: string) => void;
}

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}
function formatFileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function groupReactions(reactions: Message["reactions"]) {
  if (!Array.isArray(reactions)) return [];
  const map: Record<string, number> = {};
  for (const r of reactions) { if (r?.emoji) map[r.emoji] = (map[r.emoji] || 0) + 1; }
  return Object.entries(map);
}

export default function MessageBubble({ msg, isMine, isGrouped, myId, onReact, onReply, onEdit, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showQuickReact, setShowQuickReact] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!msg || !msg._id) return null;

  const handleMouseEnter = () => { hoverTimeout.current = setTimeout(() => setShowActions(true), 200); };
  const handleMouseLeave = () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); setShowActions(false); setShowQuickReact(false); };
  const handleTouchStart = () => { longPressTimer.current = setTimeout(() => setShowActions(true), 500); };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  const myReaction = reactions.find((r) => r?.userId === myId)?.emoji;
  const grouped = groupReactions(reactions);

  const ReadIcon = () => {
    if (!isMine) return null;
    if (msg.status === "read") return <span className="text-[10px] text-blue-400">✓✓</span>;
    if (msg.status === "delivered") return <span className="text-[10px] text-gray-400">✓✓</span>;
    return <span className="text-[10px] text-gray-600">✓</span>;
  };

  if (msg.deleted) return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"}`}>
      <div className="px-4 py-2 rounded-2xl border border-surface-border text-gray-600 text-sm italic max-w-[80%]">🚫 This message was deleted</div>
    </div>
  );

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"} relative`}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="relative max-w-[80%] md:max-w-[70%]">
        {msg.replyTo && (
          <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-brand-500 bg-surface-raised text-xs text-gray-400 ${isMine ? "ml-auto" : ""}`}>
            <span className="text-brand-500 font-medium">{msg.replyTo.senderId === myId ? "You" : "Them"}</span>
            <p className="truncate">{msg.replyTo.type === "image" ? "📷 Image" : msg.replyTo.type === "audio" ? "🎤 Voice" : msg.replyTo.message}</p>
          </div>
        )}

        <div className={`px-4 py-2.5 text-sm leading-relaxed break-words bubble-${isMine ? "sent" : "recv"}`}>
          {/* Image */}
          {msg.type === "image" && msg.fileUrl && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={msg.fileUrl} alt="sent" className="max-w-full rounded-lg cursor-pointer" style={{ maxHeight: 200 }}
                onClick={() => { try { window.open(msg.fileUrl, "_blank"); } catch {} }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}

          {/* Audio */}
          {msg.type === "audio" && msg.fileUrl && (
            <AudioMessage src={msg.fileUrl} duration={msg.duration} isMine={isMine} />
          )}

          {/* File */}
          {msg.type === "file" && msg.fileUrl && (
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${isMine ? "bg-white/10" : "bg-surface-border"}`}>
              <span className="text-2xl">📎</span>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{msg.fileName || "File"}</p>
                <p className="text-xs opacity-60">{formatFileSize(msg.fileSize || 0)}</p>
              </div>
            </a>
          )}

          {/* Text */}
          {msg.message && msg.type !== "audio" && <p>{msg.message}</p>}

          {/* Footer */}
          <div className="flex items-center justify-end gap-1.5 mt-1">
            {msg.edited && <span className="text-[10px] opacity-60">edited</span>}
            <span className="text-[10px] opacity-60">{formatTime(msg.createdAt)}</span>
            <ReadIcon />
          </div>
        </div>

        {/* Reactions */}
        {grouped.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {grouped.map(([emoji, count]) => (
              <button key={emoji} onClick={() => onReact(msg._id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${myReaction === emoji ? "bg-brand-500/20 border-brand-500/50 text-brand-500" : "bg-surface-raised border-surface-border text-gray-300"}`}>
                {emoji} {count > 1 && <span>{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Action bar */}
        {showActions && (
          <div className={`absolute top-0 ${isMine ? "right-full mr-2" : "left-full ml-2"} flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl px-2 py-1.5 shadow-xl z-10 animate-fade-in`}>
            <div className="relative">
              <button onClick={() => setShowQuickReact(!showQuickReact)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-raised transition-colors">😊</button>
              {showQuickReact && (
                <div className="absolute bottom-9 left-0 flex gap-1 bg-surface-card border border-surface-border rounded-xl px-2 py-1.5 shadow-xl z-20 animate-fade-in">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => { onReact(msg._id, emoji); setShowQuickReact(false); setShowActions(false); }}
                      className="w-7 h-7 flex items-center justify-center text-lg hover:bg-surface-raised rounded-lg transition-all hover:scale-125">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { onReply(msg); setShowActions(false); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-raised transition-colors text-gray-400 hover:text-white" title="Reply">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            {isMine && msg.type === "text" && (
              <button onClick={() => { onEdit(msg); setShowActions(false); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-raised transition-colors text-gray-400 hover:text-white" title="Edit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            {isMine && (
              <button onClick={() => { onDelete(msg._id); setShowActions(false); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400" title="Delete">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
