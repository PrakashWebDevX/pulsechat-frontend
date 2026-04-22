"use client";

import { useState, useRef, useEffect } from "react";

interface AiMsg { role: "user" | "assistant"; content: string; }

interface Props { onClose: () => void; }

export default function AIChatbot({ onClose }: Props) {
  const [messages, setMessages] = useState<AiMsg[]>([
    { role: "assistant", content: "Hey! 👋 I'm PulseBot, your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMsg: AiMsg = { role: "user", content: text };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.text || "Sorry, I had an issue responding." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-4 md:right-4 md:w-80 md:h-[500px] z-50 flex flex-col bg-surface-card border border-surface-border md:rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-surface-border flex-shrink-0 bg-gradient-to-r from-brand-500/10 to-transparent">
        <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center text-lg">🤖</div>
        <div>
          <p className="text-sm font-medium text-white">PulseBot</p>
          <p className="text-xs text-brand-500">AI Assistant • Online</p>
        </div>
        <button onClick={onClose} className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-sm flex-shrink-0 mt-1 mr-2">🤖</div>
            )}
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed
              ${msg.role === "user"
                ? "bg-brand-600 text-white rounded-br-sm"
                : "bg-surface-raised text-gray-100 rounded-bl-sm"
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-sm mr-2">🤖</div>
            <div className="bg-surface-raised rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-border p-3 flex-shrink-0">
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask me anything…"
            className="flex-1 bg-surface-raised border border-surface-border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors" />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center disabled:opacity-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-1.5 text-center">Powered by Claude AI</p>
      </div>
    </div>
  );
}
