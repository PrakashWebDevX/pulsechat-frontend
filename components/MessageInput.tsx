"use client";

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Message } from "@/types";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";

const I = {
  Emoji:  () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Attach: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  Image:  () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Mic:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>,
  Send:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>,
  Check:  () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Close:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

interface Props {
  onSend: (text: string, extras?: any) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  editingMsg: Message | null;
  onCancelEdit: () => void;
  onEditSave: (id: string, text: string) => void;
  myId: string;
}

export default function MessageInput({ onSend, onTyping, replyTo, onCancelReply, editingMsg, onCancelEdit, onEditSave, myId }: Props) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const prevEditId = useRef<string | null>(null);

  useEffect(() => {
    if (editingMsg && editingMsg._id !== prevEditId.current) {
      prevEditId.current = editingMsg._id;
      setText(editingMsg.message || "");
      setTimeout(() => taRef.current?.focus(), 50);
    }
    if (!editingMsg) prevEditId.current = null;
  }, [editingMsg]);

  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 130) + "px";
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (!isTypingRef.current) { isTypingRef.current = true; onTyping(true); }
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => { isTypingRef.current = false; onTyping(false); }, 1500);
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (typingRef.current) clearTimeout(typingRef.current);
    isTypingRef.current = false; onTyping(false);
    if (editingMsg) { if (trimmed) onEditSave(editingMsg._id, trimmed); setText(""); onCancelEdit(); return; }
    if (!trimmed) return;
    onSend(trimmed); setText("");
  }, [text, editingMsg, onSend, onEditSave, onCancelEdit, onTyping]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") { onCancelReply(); onCancelEdit(); setText(""); }
  };

  const handleFile = (file: File, type: "image" | "file") => {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => { onSend("", { type, fileUrl: reader.result as string, fileName: file.name, fileSize: file.size }); setUploading(false); };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const isEditing = !!editingMsg;
  const hasText = text.trim().length > 0;

  if (showVoice) {
    return (
      <VoiceRecorder
        onSend={(url, dur) => { setShowVoice(false); onSend("", { type: "audio", fileUrl: url, duration: dur }); }}
        onCancel={() => setShowVoice(false)}
      />
    );
  }

  return (
    <div className="flex-shrink-0 safe-pb" style={{ background: "var(--bg-app)" }}>
      {/* Reply/Edit banner */}
      {(replyTo || isEditing) && (
        <div className="flex items-center gap-3 px-4 py-2 animate-slide-up"
          style={{ background: "var(--bg-input)", borderTop: "1px solid var(--divider)" }}>
          <div className="w-1 self-stretch rounded-full flex-shrink-0"
            style={{ background: isEditing ? "#eab308" : "var(--brand)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold mb-0.5"
              style={{ color: isEditing ? "#eab308" : "var(--brand)" }}>
              {isEditing ? "Editing message" : `Reply to ${replyTo?.senderId === myId ? "yourself" : "them"}`}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
              {isEditing
                ? editingMsg!.message
                : replyTo?.type === "image" ? "📷 Photo"
                : replyTo?.type === "audio" ? "🎤 Voice message"
                : replyTo?.message}
            </p>
          </div>
          <button onClick={() => { if (isEditing) { onCancelEdit(); setText(""); } else onCancelReply(); }}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}>
            <I.Close />
          </button>
        </div>
      )}

      {/* Main input bar */}
      <div className="flex items-end gap-2 px-3 py-2">
        {/* Left section: emoji + attach */}
        <div className="flex items-center flex-shrink-0 relative">
          {/* Emoji */}
          <button onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false); }}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/5"
            style={{ color: showEmoji ? "var(--brand)" : "var(--text-muted)" }}>
            <I.Emoji />
          </button>

          {/* Emoji picker */}
          {showEmoji && (
            <div className="absolute bottom-14 left-0 z-50">
              <EmojiPicker onSelect={(e) => setText((p) => p + e)} onClose={() => setShowEmoji(false)} />
            </div>
          )}
        </div>

        {/* Textarea pill */}
        <div className="flex-1 flex items-end rounded-3xl px-4 py-2 min-h-[48px]"
          style={{ background: "var(--bg-input)" }}>
          {/* Attach (inside pill) */}
          {!isEditing && (
            <div className="relative flex-shrink-0 self-end mb-0.5">
              <button onClick={() => setShowAttach(!showAttach)}
                className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-white/10 mr-2"
                style={{ color: showAttach ? "var(--brand)" : "var(--text-muted)" }}>
                <I.Attach />
              </button>
              {showAttach && (
                <div className="absolute bottom-10 left-0 flex flex-col gap-2 p-3 rounded-2xl shadow-2xl z-50 animate-scale-in"
                  style={{ background: "var(--bg-header)", border: "1px solid var(--divider)", minWidth: 160 }}>
                  <button onClick={() => { imageRef.current?.click(); setShowAttach(false); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all hover:bg-white/10"
                    style={{ color: "var(--text-primary)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: "#7c3aed" }}>
                      <I.Image />
                    </div>
                    Photos
                  </button>
                  <button onClick={() => { fileRef.current?.click(); setShowAttach(false); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all hover:bg-white/10"
                    style={{ color: "var(--text-primary)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: "#2563eb" }}>
                      <I.Attach />
                    </div>
                    Document
                  </button>
                </div>
              )}
              <input ref={imageRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "image"); e.target.value = ""; }} />
              <input ref={fileRef} type="file" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "file"); e.target.value = ""; }} />
            </div>
          )}

          <textarea
            ref={taRef} value={text} onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder={isEditing ? "Edit message…" : "Message"}
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-1"
            style={{ color: "var(--text-primary)", caretColor: "var(--brand)", maxHeight: 130, fontSize: 15 }}
          />
        </div>

        {/* Right: send or mic */}
        <button
          onClick={hasText || uploading || isEditing ? handleSend : () => setShowVoice(true)}
          disabled={isEditing && !text.trim()}
          className="w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90"
          style={{
            background: "var(--brand)",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(0,168,132,0.4)",
          }}>
          {uploading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : isEditing ? <I.Check />
            : (hasText ? <I.Send /> : <I.Mic />)}
        </button>
      </div>
    </div>
  );
}
