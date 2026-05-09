"use client";

import { useRouter } from "next/navigation";

const I = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Phone: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0112 18.82 19.5 19.5 0 015.09 12 19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
};

export default function CallsPage() {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => router.push("/chat")}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
          style={{ color: "var(--text-secondary)" }}>
          <I.Back />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Calls</h1>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-header)" }}>
          <I.Phone />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            No calls yet
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Start a voice or video call from any chat
          </p>
        </div>
      </div>
    </div>
  );
}
