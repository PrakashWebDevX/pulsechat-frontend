"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function MessageInput({ onSend, onTyping }: Props) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Emit typing start once per burst
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }

    // Reset stop-typing debounce
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 1500);
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Clear typing state immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    onTyping(false);

    onSend(trimmed);
    setText("");
  }, [text, onSend, onTyping]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-surface-border bg-surface-card px-4 py-3 flex-shrink-0">
      <div className="flex items-end gap-3 bg-surface-raised rounded-2xl px-4 py-2 border border-surface-border focus-within:border-brand-500/50 transition-colors">
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none outline-none leading-relaxed py-1.5 max-h-32 overflow-y-auto font-sans"
          style={{ scrollbarWidth: "none" }}
        />

        {/* Emoji placeholder */}
        <button className="flex-shrink-0 p-1.5 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-surface-border">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150
            ${text.trim()
              ? "bg-brand-500 hover:bg-brand-600 text-white active:scale-95"
              : "bg-surface-border text-gray-600 cursor-not-allowed"
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-700 mt-1.5 pl-1">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}
