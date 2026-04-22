"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [msgResults, setMsgResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"all" | "users" | "messages">("all");

  const myId = (session?.user as any)?.id;

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !myId) { setUserResults([]); setMsgResults([]); return; }
    setLoading(true);
    try {
      const [usersRes, msgsRes] = await Promise.all([
        fetch(`${BASE}/api/users?excludeId=${myId}`),
        fetch(`${BASE}/api/messages/search?q=${encodeURIComponent(q)}&userId=${myId}`),
      ]);
      const users = await usersRes.json();
      const msgs = await msgsRes.json().catch(() => []);
      setUserResults(users.filter((u: any) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())));
      setMsgResults(Array.isArray(msgs) ? msgs : []);
    } catch {} finally { setLoading(false); }
  }, [myId]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-brand-500/30 text-brand-500 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  if (status === "loading") return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const showUsers = (tab === "all" || tab === "users") && userResults.length > 0;
  const showMsgs  = (tab === "all" || tab === "messages") && msgResults.length > 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-surface-border bg-surface-card flex items-center gap-3 px-4 flex-shrink-0">
        <button onClick={() => router.push("/chat")}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, messages…"
            className="w-full bg-surface-raised border border-surface-border rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors" />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">✕</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border bg-surface-card">
        {(["all", "users", "messages"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${tab === t ? "text-brand-500 border-b-2 border-brand-500" : "text-gray-500 hover:text-gray-300"}`}>
            {t === "all" ? "🔍 All" : t === "users" ? `👤 People (${userResults.length})` : `💬 Messages (${msgResults.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center text-3xl">🔍</div>
            <p className="text-gray-500 text-sm">Search for people or messages</p>
          </div>
        )}

        {!loading && query && !showUsers && !showMsgs && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-4xl">😕</div>
            <p className="text-gray-500 text-sm">No results for "{query}"</p>
          </div>
        )}

        {/* Users */}
        {showUsers && (
          <div className="p-4">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-3">People</p>
            <div className="space-y-2">
              {userResults.map((user) => (
                <button key={user._id} onClick={() => router.push("/chat")}
                  className="w-full flex items-center gap-3 p-3 bg-surface-card border border-surface-border rounded-xl hover:border-brand-500/30 transition-all">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 font-semibold">{user.name[0]}</div>
                  )}
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium text-white">{highlight(user.name, query)}</span>
                    <span className="text-xs text-gray-500 truncate">{highlight(user.email, query)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {showMsgs && (
          <div className="p-4">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-3">Messages</p>
            <div className="space-y-2">
              {msgResults.map((msg: any) => (
                <button key={msg._id} onClick={() => router.push("/chat")}
                  className="w-full flex flex-col gap-1 p-3 bg-surface-card border border-surface-border rounded-xl hover:border-brand-500/30 transition-all text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-brand-500">{msg.senderName || "Unknown"}</span>
                    <span className="text-xs text-gray-600">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-300 truncate">{highlight(msg.message, query)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
