"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const I = {
  Back:   () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Close:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Msg:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  User:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

type Tab = "all" | "contacts" | "messages";

export default function SearchPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  useEffect(() => {
    if (!query.trim() || !user?.id) { setUsers([]); setMessages([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [uRes, mRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/search?q=${encodeURIComponent(query)}&userId=${user.id}`),
          fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/messages/search?q=${encodeURIComponent(query)}&userId=${user.id}`),
        ]);
        if (uRes.ok) setUsers(await uRes.json());
        if (mRes.ok) setMessages(await mRes.json());
      } catch {}
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, user?.id]);

  function highlight(text: string, q: string) {
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "rgba(0,168,132,0.3)", color: "var(--brand)", borderRadius: 2 }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  const showUsers = tab === "all" || tab === "contacts";
  const showMessages = tab === "all" || tab === "messages";

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-3 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 flex-shrink-0"
          style={{ color: "var(--text-secondary)" }}>
          <I.Back />
        </button>
        <div className="flex-1 flex items-center gap-3 px-3 h-10 rounded-xl"
          style={{ background: "var(--bg-input)" }}>
          <I.Search />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts or messages…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }} />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "var(--text-muted)" }}>
              <I.Close />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        {(["all", "contacts", "messages"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={{
              background: tab === t ? "var(--brand)" : "var(--bg-input)",
              color: tab === t ? "#fff" : "var(--text-secondary)",
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query && (
          <div className="flex flex-col items-center justify-center h-full gap-3 pb-20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-header)", color: "var(--text-muted)" }}>
              <I.Search />
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Search for people or messages</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ border: "2px solid var(--brand)", borderTopColor: "transparent" }} />
          </div>
        )}

        {query && !loading && (
          <>
            {/* Contacts section */}
            {showUsers && users.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}>Contacts</p>
                {users.map((u) => (
                  <button key={u._id}
                    onClick={() => router.push("/chat")}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all"
                    style={{ borderBottom: "1px solid var(--divider)" }}>
                    {u.image ? (
                      <img src={u.image} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                        style={{ background: "var(--brand)" }}>{u.name?.[0]}</div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {highlight(u.name, query)}
                      </p>
                      <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
                        {highlight(u.email, query)}
                      </p>
                    </div>
                    <div style={{ color: "var(--brand)" }}><I.Msg /></div>
                  </button>
                ))}
              </div>
            )}

            {/* Messages section */}
            {showMessages && messages.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}>Messages</p>
                {messages.map((m) => (
                  <button key={m._id}
                    onClick={() => router.push("/chat")}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all"
                    style={{ borderBottom: "1px solid var(--divider)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                      <I.Msg />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate text-sm" style={{ color: "var(--text-primary)" }}>
                        {highlight(m.message, query)}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {users.length === 0 && messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>No results</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No results for "{query}"
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
