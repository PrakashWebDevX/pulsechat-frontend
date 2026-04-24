"use client";

import { useState, useRef, useCallback } from "react";
import { Message } from "@/types";
import AudioMessage from "./AudioMessage";

// SVG Icons
const Icons = {
  Reply:   () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>,
  Edit:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Delete:  () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  React:   () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Star:    () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Forward: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/></svg>,
};

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}
function formatFileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}
function groupReactions(reactions: Message["reactions"]) {
  const map: Record<string, number> = {};
  for (const r of reactions || []) { if (r?.emoji) map[r.emoji] = (map[r.emoji] || 0) + 1; }
  return Object.entries(map);
}

interface Props {
  msg: Message;
  isMine: boolean;
  isGrouped: boolean;
  myId: string;
  onReact: (id: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (id: string) => void;
}

export default function MessageBubble({ msg, isMine, isGrouped, myId, onReact, onReply, onEdit, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showQuickReact, setShowQuickReact] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeTriggered = useRef(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!msg?._id) return null;

  // ── Swipe to reply ────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeTriggered.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    // Only horizontal swipe, not vertical scroll
    if (dy > 20) return;

    // Right swipe to reply (both sent and received)
    const swipeDir = isMine ? dx < 0 : dx > 0;
    if (!swipeDir) return;

    const absDx = Math.abs(dx);
    if (absDx > 10) {
      setIsSwiping(true);
      const clamped = Math.min(absDx, 80);
      setSwipeX(isMine ? -clamped : clamped);

      if (absDx > 60 && !swipeTriggered.current) {
        swipeTriggered.current = true;
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(20);
      }
    }
  };

  const handleTouchEnd = () => {
    if (swipeTriggered.current) {
      onReply(msg);
    }
    setSwipeX(0);
    setIsSwiping(false);
    swipeTriggered.current = false;
  };

  // ── Hover actions (desktop) ───────────────────────────────────────────
  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setShowActions(true), 150);
  };
  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setShowActions(false);
    setShowQuickReact(false);
  };

  // Long press (mobile)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => setShowActions(true), 600);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  const myReaction = reactions.find((r) => r?.userId === myId)?.emoji;
  const grouped = groupReactions(reactions);

  const ReadTick = () => {
    if (!isMine) return null;
    const color = msg.status === "read" ? "#60a5fa" : msg.status === "delivered" ? "var(--text-muted)" : "var(--text-muted)";
    const isDouble = msg.status === "delivered" || msg.status === "read";
    return (
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
        {isDouble && <path d="M1 5l3 3L10 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>}
        <path d={isDouble ? "M5 5l3 3L14 1" : "M3 5l3 3L13 1"} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  if (msg.deleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"}`}>
        <div className="px-4 py-2 rounded-2xl text-sm italic"
          style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"} relative select-none`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Swipe reply indicator */}
      {isSwiping && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${isMine ? "left-0" : "right-0"} flex items-center justify-center w-8 h-8 rounded-full transition-opacity`}
          style={{
            background: "var(--brand-glow)",
            color: "var(--brand)",
            opacity: Math.abs(swipeX) / 80,
          }}>
          <Icons.Reply />
        </div>
      )}

      <div className="relative max-w-[78%] md:max-w-[65%]"
        style={{ transform: `translateX(${swipeX}px)`, transition: isSwiping ? "none" : "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
        onTouchStart={(e) => { handleTouchStart(e); handleLongPressStart(); }}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => { handleTouchEnd(); handleLongPressEnd(); }}
        onTouchCancel={handleLongPressEnd}
      >
        {/* Reply preview */}
        {msg.replyTo && (
          <div className={`mb-1 px-3 py-1.5 rounded-xl text-xs ${isMine ? "ml-auto" : ""}`}
            style={{ background: "var(--bg-raised)", borderLeft: "3px solid var(--brand)", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--brand)", fontWeight: 600 }}>
              {msg.replyTo.senderId === myId ? "You" : "Them"}
            </span>
            <p className="truncate">{msg.replyTo.type === "image" ? "📷 Image" : msg.replyTo.type === "audio" ? "🎤 Voice" : msg.replyTo.message}</p>
          </div>
        )}

        {/* Bubble */}
        <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${isMine ? "bubble-sent" : "bubble-recv"}`}>
          {/* Image */}
          {msg.type === "image" && msg.fileUrl && (
            <div className="mb-2 -mx-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={msg.fileUrl} alt="" className="max-w-full rounded-xl cursor-pointer"
                style={{ maxHeight: 220 }}
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
              className="flex items-center gap-2 p-2 rounded-xl mb-1"
              style={{ background: isMine ? "rgba(255,255,255,0.12)" : "var(--bg-border)" }}>
              <span className="text-2xl">📎</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{msg.fileName || "File"}</p>
                <p className="text-xs opacity-60">{formatFileSize(msg.fileSize || 0)}</p>
              </div>
            </a>
          )}
          {/* Text */}
          {msg.message && msg.type !== "audio" && <p style={{ whiteSpace: "pre-wrap" }}>{msg.message}</p>}

          {/* Footer */}
          <div className="flex items-center justify-end gap-1.5 mt-1">
            {msg.edited && <span className="text-[10px] opacity-50">edited</span>}
            <span className="text-[10px] opacity-60">{formatTime(msg.createdAt)}</span>
            {isMine && <ReadTick />}
          </div>
        </div>

        {/* Reactions */}
        {grouped.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {grouped.map(([emoji, count]) => (
              <button key={emoji} onClick={() => onReact(msg._id, emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-110"
                style={{
                  background: myReaction === emoji ? "var(--brand-glow)" : "var(--bg-raised)",
                  border: `1px solid ${myReaction === emoji ? "var(--brand)" : "var(--bg-border)"}`,
                  color: myReaction === emoji ? "var(--brand)" : "var(--text-secondary)",
                }}>
                {emoji}{count > 1 && <span>{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Action bar (hover desktop / long press mobile) */}
        {showActions && (
          <div
            className={`absolute top-0 ${isMine ? "right-full mr-2" : "left-full ml-2"} flex items-center gap-0.5 rounded-2xl px-1.5 py-1.5 shadow-2xl z-20 animate-scale-in`}
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}>

            {/* Quick react */}
            <div className="relative">
              <button onClick={() => setShowQuickReact(!showQuickReact)}
                className="w-7 h-7 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                <Icons.React />
              </button>
              {showQuickReact && (
                <div className="absolute bottom-10 left-0 flex gap-1 rounded-2xl px-2 py-2 shadow-2xl z-30 animate-scale-in"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <button key={emoji}
                      onClick={() => { onReact(msg._id, emoji); setShowQuickReact(false); setShowActions(false); }}
                      className="w-8 h-8 flex items-center justify-center text-lg rounded-xl transition-all hover:scale-125">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply */}
            <button onClick={() => { onReply(msg); setShowActions(false); }}
              className="w-7 h-7 flex items-center justify-center rounded-xl transition-all hover:scale-110"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
              <Icons.Reply />
            </button>

            {/* Edit (own text messages) */}
            {isMine && msg.type === "text" && (
              <button onClick={() => { onEdit(msg); setShowActions(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                <Icons.Edit />
              </button>
            )}

            {/* Delete (own messages) */}
            {isMine && (
              <button onClick={() => { onDelete(msg._id); setShowActions(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
                <Icons.Delete />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
