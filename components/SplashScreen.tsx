"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "pulse" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("pulse"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500
        ${phase === "exit" ? "opacity-0 scale-110" : "opacity-100 scale-100"}`}
      style={{ background: "linear-gradient(135deg, #0a0f1a 0%, #0f1a0a 50%, #0a0f1a 100%)" }}
    >
      {/* Animated background rings */}
      <div className="absolute inset-0 overflow-hidden">
        {[1,2,3].map((i) => (
          <div key={i} className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full border border-green-500/10"
              style={{
                width: `${200 + i * 120}px`,
                height: `${200 + i * 120}px`,
                animation: `ping ${1.5 + i * 0.5}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Logo */}
      <div className={`relative z-10 flex flex-col items-center gap-6 transition-all duration-700
        ${phase === "enter" ? "opacity-0 translate-y-8 scale-90" : "opacity-100 translate-y-0 scale-100"}`}>

        {/* Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 0 60px rgba(34,197,94,0.4)" }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Glow */}
          <div className="absolute inset-0 rounded-3xl blur-xl opacity-60"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }} />
        </div>

        {/* App name */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#fff" }}>
            Pulse<span style={{ color: "#22c55e" }}>Chat</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Connect. Communicate. Now.
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #22c55e, #16a34a)",
              animation: "loadBar 1.8s ease-in-out forwards",
            }} />
        </div>
      </div>

      <style>{`
        @keyframes loadBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
