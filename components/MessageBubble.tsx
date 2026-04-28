"use client";

import { useState, useRef } from "react";
import { Message } from "@/types";
import AudioMessage from "./AudioMessage";

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🙏"];

const I = {
  Reply:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>,
  Edit:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Delete:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  React:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Forward: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 014-4h12"/></svg>,
  SwipeReply: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>,
};

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}
function formatFileSize(b: number) {
  if (!b) return "";
  if (b < 1024) return `${b}B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1048576).toFixed(1)}MB`;
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
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeFired = useRef(false);
  const hoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!msg?._id) return null;

  // ── Swipe to reply ────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeFired.current = false;
    longRef.current = setTimeout(() => setShowActions(true), 600);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dy > 15) { if (longRef.current) clearTimeout(longRef.current); return; }
    if (longRef.current) clearTimeout(longRef.current);

    const dir = isMine ? dx < 0 : dx > 0;
    if (!dir) return;
    const abs = Math.min(Math.abs(dx), 80);
    setSwipeX(isMine ? -abs : abs);
    if (Math.abs(dx) > 55 && !swipeFired.current) {
      swipeFired.current = true;
      if (navigator.vibrate) navigator.vibrate([15]);
    }
  };
  const onTouchEnd = () => {
    if (longRef.current) clearTimeout(longRef.current);
    if (swipeFired.current) onReply(msg);
    setSwipeX(0);
    swipeFired.current = false;
  };

  const onMouseEnter = () => { hoverRef.current = setTimeout(() => setShowActions(true), 200); };
  const onMouseLeave = () => { if (hoverRef.current) clearTimeout(hoverRef.current); setShowActions(false); setShowQuickReact(false); };

  const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
  const myReaction = reactions.find((r) => r?.userId === myId)?.emoji;
  const grouped = groupReactions(reactions);

  // WhatsApp-style double tick
  const Ticks = () => {
    if (!isMine) return null;
    const color = msg.status === "read" ? "var(--tick-read)" : "var(--text-muted)";
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        {(msg.status === "delivered" || msg.status === "read") && (
          <path d="M1 5.5L4.5 9L10 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        )}
        <path d={msg.status === "sent" ? "M5 5.5L8.5 9L15 2" : "M5 5.5L8.5 9L15 2"} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  if (msg.deleted) return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"} px-4`}>
      <div className="px-4 py-2 rounded-lg text-sm italic"
        style={{ background: "var(--bg-bubble-in)", color: "var(--text-muted)", border: "1px solid var(--divider)" }}>
        🚫 This message was deleted
      </div>
    </div>
  );

  const swipeOpacity = Math.abs(swipeX) / 80;

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-2"} px-3 relative`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Swipe reply icon */}
      {swipeX !== 0 && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? "left-3" : "right-3"} w-8 h-8 rounded-full flex items-center justify-center`}
          style={{ background: "var(--bg-input)", color: "var(--text-secondary)", opacity: swipeOpacity, transition: "opacity 0.1s" }}>
          <I.SwipeReply />
        </div>
      )}

      <div className="relative max-w-[75%] md:max-w-[60%]"
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX !== 0 ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        {/* Reply preview */}
        {msg.replyTo && (
          <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs border-l-4 ${isMine ? "ml-auto" : ""}`}
            style={{ background: isMine ? "rgba(0,0,0,0.2)" : "var(--bg-input)", borderLeftColor: "var(--brand)", color: "var(--text-secondary)", maxWidth: "100%" }}>
            <p className="font-semibold text-xs mb-0.5" style={{ color: "var(--brand)" }}>
              {msg.replyTo.senderId === myId ? "You" : "Them"}
            </p>
            <p className="truncate">{msg.replyTo.type === "image" ? "📷 Photo" : msg.replyTo.type === "audio" ? "🎤 Voice message" : msg.replyTo.message}</p>
          </div>
        )}

        {/* Bubble */}
        <div className={`${isMine ? "bubble-sent" : "bubble-recv"} px-3 py-2`}
          style={{ fontSize: 14.5, lineHeight: 1.5 }}>

          {/* Image */}
          {msg.type === "image" && msg.fileUrl && (
            <div className="mb-1 -mx-1 -mt-1 overflow-hidden rounded-t-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={msg.fileUrl} alt="" className="max-w-full cursor-pointer object-cover"
                style={{ maxHeight: 260, width: "100%" }}
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
              className="flex items-center gap-3 p-2 rounded-lg mb-2"
              style={{ background: isMine ? "rgba(0,0,0,0.15)" : "var(--bg-search)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--brand)", color: "#fff" }}>
                <I.Forward />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{msg.fileName || "File"}</p>
                <p className="text-xs opacity-60">{formatFileSize(msg.fileSize || 0)}</p>
              </div>
            </a>
          )}

          {/* Text */}
          {msg.message && msg.type !== "audio" && (
            <span style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{msg.message}</span>
          )}

          {/* Footer: time + ticks */}
          <div className="flex items-center justify-end gap-1 mt-1" style={{ marginBottom: -2, marginRight: -2 }}>
            {msg.edited && <span style={{ fontSize: 10, opacity: 0.6 }}>edited</span>}
            <span style={{ fontSize: 11, color: isMine ? "rgba(255,255,255,0.65)" : "var(--text-time)" }}>
              {formatTime(msg.createdAt)}
            </span>
            {isMine && <Ticks />}
          </div>
        </div>

        {/* Reactions */}
        {grouped.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {grouped.map(([emoji, count]) => (
              <button key={emoji} onClick={() => onReact(msg._id, emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-110"
                style={{
                  background: myReaction === emoji ? "rgba(0,168,132,0.2)" : "var(--bg-input)",
                  border: `1px solid ${myReaction === emoji ? "var(--brand)" : "var(--divider)"}`,
                  color: myReaction === emoji ? "var(--brand)" : "var(--text-secondary)",
                }}>
                {emoji}{count > 1 && <span>{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Hover action bar */}
        {showActions && (
          <div className={`absolute top-0 ${isMine ? "right-full mr-1" : "left-full ml-1"} flex items-center gap-0.5 rounded-xl px-1 py-1 z-20 shadow-2xl animate-scale-in`}
            style={{ background: "var(--bg-header)", border: `1px solid var(--divider)` }}>

            {/* Quick react */}
            <div className="relative">
              <button onClick={() => setShowQuickReact(!showQuickReact)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
                <I.React />
              </button>
              {showQuickReact && (
                <div className="absolute bottom-10 left-0 flex gap-1 rounded-2xl px-2 py-2 z-30 shadow-2xl animate-scale-in"
                  style={{ background: "var(--bg-header)", border: `1px solid var(--divider)` }}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => { onReact(msg._id, emoji); setShowQuickReact(false); setShowActions(false); }}
                      className="w-9 h-9 flex items-center justify-center text-xl rounded-xl transition-all hover:scale-125 hover:bg-white/10">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply */}
            <button onClick={() => { onReply(msg); setShowActions(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
              <I.Reply />
            </button>

            {/* Edit */}
            {isMine && msg.type === "text" && (
              <button onClick={() => { onEdit(msg); setShowActions(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
                <I.Edit />
              </button>
            )}

            {/* Delete */}
            {isMine && (
              <button onClick={() => { onDelete(msg._id); setShowActions(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}>
                <I.Delete />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
