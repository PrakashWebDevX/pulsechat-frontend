"use client";

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Message } from "@/types";
import EmojiPicker from "./EmojiPicker";
import VoiceRecorder from "./VoiceRecorder";

const Icons = {
  Emoji:  () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Image:  () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Attach: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  Mic:    () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>,
  Send:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Check:  () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  Close:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
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

export default function MessageInput({
  onSend, onTyping, replyTo, onCancelReply,
  editingMsg, onCancelEdit, onEditSave, myId,
}: Props) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevEditId = useRef<string | null>(null);

  // Pre-fill on edit
  useEffect(() => {
    if (editingMsg && editingMsg._id !== prevEditId.current) {
      prevEditId.current = editingMsg._id;
      setText(editingMsg.message || "");
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
    if (!editingMsg) prevEditId.current = null;
  }, [editingMsg]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (!isTypingRef.current) { isTypingRef.current = true; onTyping(true); }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { isTypingRef.current = false; onTyping(false); }, 1500);
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTypingRef.current = false; onTyping(false);

    if (editingMsg) {
      if (trimmed) onEditSave(editingMsg._id, trimmed);
      setText(""); onCancelEdit(); return;
    }
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
    reader.onload = () => {
      onSend("", { type, fileUrl: reader.result as string, fileName: file.name, fileSize: file.size });
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const isEditing = !!editingMsg;
  const canSend = text.trim().length > 0 || uploading;

  if (showVoice) {
    return (
      <VoiceRecorder
        onSend={(url, dur) => { setShowVoice(false); onSend("", { type: "audio", fileUrl: url, duration: dur }); }}
        onCancel={() => setShowVoice(false)}
      />
    );
  }

  return (
    <div className="flex-shrink-0 safe-area-bottom" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--bg-border)" }}>
      {/* Reply preview */}
      {replyTo && !isEditing && (
        <div className="flex items-center gap-3 px-4 pt-3 pb-1 animate-slide-up">
          <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: "var(--brand)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              Replying to {replyTo.senderId === myId ? "yourself" : "them"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {replyTo.type === "image" ? "📷 Image" : replyTo.type === "audio" ? "🎤 Voice" : replyTo.message}
            </p>
          </div>
          <button onClick={onCancelReply} className="flex-shrink-0 p-1" style={{ color: "var(--text-muted)" }}>
            <Icons.Close />
          </button>
        </div>
      )}

      {/* Edit banner */}
      {isEditing && (
        <div className="flex items-center gap-3 px-4 pt-3 pb-1 animate-slide-up">
          <div className="w-0.5 h-8 rounded-full flex-shrink-0" style={{ background: "#eab308" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "#eab308" }}>✏️ Editing message</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{editingMsg!.message}</p>
          </div>
          <button onClick={() => { onCancelEdit(); setText(""); }} className="flex-shrink-0 p-1" style={{ color: "var(--text-muted)" }}>
            <Icons.Close />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="px-3 py-3 relative">
        {showEmoji && (
          <EmojiPicker onSelect={(e) => setText((p) => p + e)} onClose={() => setShowEmoji(false)} />
        )}

        <div className="flex items-end gap-2 rounded-2xl px-3 py-2 transition-all"
          style={{
            background: "var(--bg-raised)",
            border: "1.5px solid var(--bg-border)",
          }}
          onFocus={() => {}} // focus handled by textarea
        >
          {/* Emoji */}
          <button onClick={() => setShowEmoji(!showEmoji)}
            className="flex-shrink-0 p-1.5 rounded-xl transition-all hover:scale-110"
            style={{ color: showEmoji ? "var(--brand)" : "var(--text-muted)" }}>
            <Icons.Emoji />
          </button>

          {/* Image + File (only when not editing) */}
          {!isEditing && (
            <>
              <button onClick={() => imageRef.current?.click()}
                className="flex-shrink-0 p-1.5 rounded-xl transition-all hover:scale-110"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                <Icons.Image />
              </button>
              <input ref={imageRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "image"); e.target.value = ""; }} />

              <button onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 p-1.5 rounded-xl transition-all hover:scale-110"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                <Icons.Attach />
              </button>
              <input ref={fileRef} type="file" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "file"); e.target.value = ""; }} />
            </>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isEditing ? "Edit your message…" : "Type a message…"}
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed py-1.5 overflow-hidden"
            style={{ color: "var(--text-primary)", caretColor: "var(--brand)" }}
          />

          {/* Mic (when no text) */}
          {!text.trim() && !isEditing && (
            <button onClick={() => setShowVoice(true)}
              className="flex-shrink-0 p-1.5 rounded-xl transition-all hover:scale-110"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
              <Icons.Mic />
            </button>
          )}

          {/* Send button */}
          <button onClick={handleSend} disabled={!canSend}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              background: canSend ? "linear-gradient(135deg, var(--brand), var(--brand-dark))" : "var(--bg-border)",
              color: canSend ? "#fff" : "var(--text-muted)",
              boxShadow: canSend ? "0 4px 12px var(--brand-glow)" : "none",
              transform: canSend ? "scale(1)" : "scale(0.95)",
            }}>
            {uploading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : isEditing ? <Icons.Check /> : <Icons.Send />}
          </button>
        </div>
      </div>
    </div>
  );
}
