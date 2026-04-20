"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Message } from "@/types";
import EmojiPicker from "./EmojiPicker";

interface Props {
  onSend: (text: string, extras?: { type?: "image" | "file"; fileUrl?: string; fileName?: string; fileSize?: number }) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  editingMsg: Message | null;
  onCancelEdit: () => void;
  onEditSave: (messageId: string, newText: string) => void;
  myId: string;
}

export default function MessageInput({
  onSend, onTyping, replyTo, onCancelReply, editingMsg, onCancelEdit, onEditSave, myId,
}: Props) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill text when entering edit mode
  const prevEditId = useRef<string | null>(null);
  if (editingMsg && editingMsg._id !== prevEditId.current) {
    prevEditId.current = editingMsg._id;
    setText(editingMsg.message);
  }
  if (!editingMsg && prevEditId.current) {
    prevEditId.current = null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (!isTypingRef.current) { isTypingRef.current = true; onTyping(true); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { isTypingRef.current = false; onTyping(false); }, 1500);
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !editingMsg) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    onTyping(false);

    if (editingMsg) {
      onEditSave(editingMsg._id, trimmed);
      setText("");
      onCancelEdit();
      return;
    }

    onSend(trimmed);
    setText("");
  }, [text, editingMsg, onSend, onEditSave, onCancelEdit, onTyping]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") { onCancelReply(); onCancelEdit(); setText(""); }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  // Upload file to a free image host (imgbb via their API, or use base64 for demo)
  const handleFileUpload = async (file: File, type: "image" | "file") => {
    setUploading(true);
    try {
      // For demo: convert to base64 data URL (works without a server)
      // In production: upload to S3/Cloudinary/imgbb
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onSend("", {
          type,
          fileUrl: dataUrl,
          fileName: file.name,
          fileSize: file.size,
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const isEditing = !!editingMsg;

  return (
    <div className="border-t border-surface-border bg-surface-card flex-shrink-0">
      {/* Reply preview */}
      {replyTo && !isEditing && (
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
          <div className="flex-1 pl-3 border-l-2 border-brand-500 text-xs text-gray-400">
            <span className="text-brand-500 font-medium">
              Replying to {replyTo.senderId === myId ? "yourself" : "them"}
            </span>
            <p className="truncate">{replyTo.type === "image" ? "📷 Image" : replyTo.message}</p>
          </div>
          <button onClick={onCancelReply} className="text-gray-600 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Edit mode banner */}
      {isEditing && (
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
          <div className="flex-1 pl-3 border-l-2 border-yellow-500 text-xs text-gray-400">
            <span className="text-yellow-500 font-medium">✏️ Editing message</span>
            <p className="truncate">{editingMsg!.message}</p>
          </div>
          <button onClick={() => { onCancelEdit(); setText(""); }} className="text-gray-600 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 relative">
        {/* Emoji picker */}
        {showEmoji && (
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        )}

        <div className="flex items-end gap-3 bg-surface-raised rounded-2xl px-4 py-2 border border-surface-border focus-within:border-brand-500/50 transition-colors">
          {/* Emoji button */}
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${showEmoji ? "text-brand-500" : "text-gray-600 hover:text-gray-300"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Image upload */}
          {!isEditing && (
            <>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex-shrink-0 p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-surface-border"
                title="Send image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "image"); e.target.value = ""; }} />

              {/* File upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-surface-border"
                title="Send file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "file"); e.target.value = ""; }} />
            </>
          )}

          {/* Text input */}
          <textarea
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isEditing ? "Edit your message…" : "Type a message…"}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none outline-none leading-relaxed py-1.5 max-h-32 overflow-y-auto font-sans"
            style={{ scrollbarWidth: "none" }}
          />

          {/* Send/Save button */}
          <button
            onClick={handleSend}
            disabled={!text.trim() && !uploading}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150
              ${text.trim() || uploading
                ? "bg-brand-500 hover:bg-brand-600 text-white active:scale-95"
                : "bg-surface-border text-gray-600 cursor-not-allowed"
              }`}
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isEditing ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-1.5 pl-1">
          {isEditing ? "Enter to save · Esc to cancel" : "Enter to send · Shift+Enter for newline · Esc to cancel reply"}
        </p>
      </div>
    </div>
  );
}
