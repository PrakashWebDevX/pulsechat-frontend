"use client";

import { useState } from "react";
import { Message } from "@/types";

// ── Export Chat ────────────────────────────────────────────────────────────
export function exportChat(messages: Message[], partnerName: string, myId: string) {
  const lines = messages
    .filter((m) => !m.deleted)
    .map((m) => {
      const time = new Date(m.createdAt).toLocaleString();
      const sender = String(m.senderId) === myId ? "You" : partnerName;
      const content = m.type === "image" ? "[Image]" : m.type === "audio" ? "[Voice Message]" : m.type === "file" ? `[File: ${m.fileName}]` : m.message;
      return `[${time}] ${sender}: ${content}`;
    });

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chat-with-${partnerName}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Message Forward Modal ─────────────────────────────────────────────────
interface ForwardProps {
  message: Message;
  users: any[];
  onForward: (targetId: string, targetName: string) => void;
  onClose: () => void;
}

export function ForwardModal({ message, users, onForward, onClose }: ForwardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 className="text-white font-semibold">Forward Message</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">✕</button>
        </div>
        <div className="p-3 border-b border-surface-border">
          <div className="bg-surface-raised rounded-xl px-3 py-2 text-sm text-gray-400 italic truncate">
            "{message.type === "text" ? message.message : `[${message.type}]`}"
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {users.map((user) => (
            <button key={user._id} onClick={() => setSelected(user._id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${selected === user._id ? "bg-brand-500/15 border border-brand-500/30" : "hover:bg-surface-raised"}`}>
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface-border flex items-center justify-center text-sm font-semibold text-gray-300">{user.name[0]}</div>
              )}
              <span className="text-sm text-white">{user.name}</span>
              {selected === user._id && <span className="ml-auto text-brand-500">✓</span>}
            </button>
          ))}
        </div>
        <div className="p-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-surface-border text-gray-400 text-sm hover:bg-surface-raised transition-colors">Cancel</button>
          <button onClick={() => { if (selected) { const u = users.find((x) => x._id === selected); onForward(selected, u?.name || ""); onClose(); } }}
            disabled={!selected}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
            Forward →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Message Modal ────────────────────────────────────────────────
interface ScheduleProps {
  text: string;
  onSchedule: (text: string, sendAt: Date) => void;
  onClose: () => void;
}

export function ScheduleModal({ text, onSchedule, onClose }: ScheduleProps) {
  const [datetime, setDatetime] = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 5);
    return d.toISOString().slice(0, 16);
  });

  const handle = () => {
    const sendAt = new Date(datetime);
    if (sendAt <= new Date()) { alert("Please select a future time"); return; }
    onSchedule(text, sendAt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 className="text-white font-semibold">🗓️ Schedule Message</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-surface-raised rounded-xl px-3 py-2 text-sm text-gray-300 italic">"{text}"</div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Send at</label>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)}
              className="w-full bg-surface-raised border border-surface-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-500/50 transition-colors" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-surface-border text-gray-400 text-sm hover:bg-surface-raised transition-colors">Cancel</button>
          <button onClick={handle} className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">Schedule ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── Pin Message Banner ────────────────────────────────────────────────────
interface PinProps {
  message: Message | null;
  onUnpin: () => void;
  onClick: () => void;
}

export function PinnedMessageBanner({ message, onUnpin, onClick }: PinProps) {
  if (!message) return null;
  return (
    <div className="border-b border-surface-border bg-surface-card/80 backdrop-blur-sm flex items-center gap-3 px-4 py-2 cursor-pointer" onClick={onClick}>
      <div className="w-0.5 h-8 bg-brand-500 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-500 font-medium">📌 Pinned Message</p>
        <p className="text-xs text-gray-400 truncate">{message.type === "text" ? message.message : `[${message.type}]`}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onUnpin(); }} className="text-gray-600 hover:text-gray-300 transition-colors text-xs px-2">✕</button>
    </div>
  );
}

// ── Starred Messages Store ────────────────────────────────────────────────
export function getStarredMessages(): string[] {
  try { return JSON.parse(localStorage.getItem("pc_starred") || "[]"); } catch { return []; }
}

export function toggleStar(messageId: string): boolean {
  const starred = getStarredMessages();
  const idx = starred.indexOf(messageId);
  if (idx !== -1) { starred.splice(idx, 1); localStorage.setItem("pc_starred", JSON.stringify(starred)); return false; }
  starred.push(messageId); localStorage.setItem("pc_starred", JSON.stringify(starred)); return true;
}

export function isStarred(messageId: string): boolean {
  return getStarredMessages().includes(messageId);
}
