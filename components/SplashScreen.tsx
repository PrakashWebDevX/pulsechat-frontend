"use client";

import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"enter" | "pulse" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("pulse"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0b141a 0%, #111b21 50%, #0b141a 100%)",
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.5s ease-out" : "opacity 0.4s ease-in",
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes ping-mid {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes logo-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes bar-fill {
          0%   { width: 0%; }
          80%  { width: 90%; }
          100% { width: 100%; }
        }
        @keyframes text-up {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
        .splash-ring-1 {
          animation: ping-slow 1.4s ease-out infinite;
          animation-delay: 0.3s;
        }
        .splash-ring-2 {
          animation: ping-mid 1.4s ease-out infinite;
          animation-delay: 0.1s;
        }
        .splash-logo {
          animation: logo-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .splash-bar {
          animation: bar-fill 2s ease-out forwards;
        }
        .splash-text {
          animation: text-up 0.5s ease-out 0.4s both;
        }
        .splash-sub {
          animation: text-up 0.5s ease-out 0.7s both;
        }
        .sdot { animation: dot-bounce 1.2s ease-in-out infinite; display:inline-block; }
        .sdot:nth-child(2) { animation-delay: 0.15s; }
        .sdot:nth-child(3) { animation-delay: 0.3s; }
      `}</style>

      {/* Rings */}
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        <div className="splash-ring-1 absolute inset-0 rounded-full"
          style={{ background: "rgba(0,168,132,0.15)" }} />
        <div className="splash-ring-2 absolute rounded-full"
          style={{ inset: 16, background: "rgba(0,168,132,0.2)" }} />

        {/* Logo circle */}
        <div className="splash-logo w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #00a884, #008f72)",
            boxShadow: "0 0 40px rgba(0,168,132,0.5), 0 20px 60px rgba(0,0,0,0.5)",
          }}>
          {/* Chat bubble SVG */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
      </div>

      {/* App name */}
      <div className="splash-text mt-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-wide">PulseChat</h1>
      </div>

      {/* Tagline */}
      <div className="splash-sub mt-2 text-center">
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          Connect instantly, anywhere
        </p>
      </div>

      {/* Loading bar */}
      <div className="mt-12 w-48 h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="splash-bar h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #00a884, #25d366)" }} />
      </div>

      {/* Dots */}
      <div className="mt-4 flex gap-1.5">
        <span className="sdot w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand, #00a884)" }} />
        <span className="sdot w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand, #00a884)" }} />
        <span className="sdot w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand, #00a884)" }} />
      </div>

      {/* Bottom watermark */}
      <div style={{ position: "absolute", bottom: 32, color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
        from PulseChat
      </div>
    </div>
  );
}
