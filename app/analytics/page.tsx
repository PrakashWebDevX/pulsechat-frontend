"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

interface Stats {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  totalChats: number;
  mediaShared: number;
  avgResponseTime: string;
  mostActiveDay: string;
  mostActiveHour: string;
  topContact: string;
  messagesByDay: { day: string; count: number }[];
  messagesByHour: { hour: string; count: number }[];
}

function StatCard({ icon, label, value, color = "brand" }: { icon: string; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center text-2xl flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-400 w-6 flex-shrink-0">{value}</span>
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f97316", "#ec4899", "#06b6d4", "#eab308"];

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const myId = (session?.user as any)?.id;

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (!myId) return;
    fetch(`${BASE}/api/analytics?userId=${myId}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [myId]);

  if (status === "loading" || loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="h-16 border-b border-surface-border bg-surface-card flex items-center gap-4 px-4">
        <button onClick={() => router.push("/chat")} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-white font-semibold">Analytics</h1>
        <span className="text-xs text-gray-500 ml-auto">Last 30 days</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {!stats ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-400 font-medium">No analytics yet</p>
            <p className="text-gray-600 text-sm mt-1">Start chatting to see your stats!</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon="💬" label="Total Messages" value={stats.totalMessages} />
              <StatCard icon="📤" label="Sent" value={stats.sentMessages} />
              <StatCard icon="📥" label="Received" value={stats.receivedMessages} />
              <StatCard icon="🖼️" label="Media Shared" value={stats.mediaShared} />
            </div>

            {/* Activity by day */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
              <h3 className="text-sm font-medium text-white mb-4">Messages by Day</h3>
              <div className="space-y-2">
                {stats.messagesByDay.map((d, i) => (
                  <MiniBar key={d.day} label={d.day} value={d.count} max={Math.max(...stats.messagesByDay.map((x) => x.count))} color={COLORS[i % COLORS.length]} />
                ))}
              </div>
            </div>

            {/* Activity by hour */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
              <h3 className="text-sm font-medium text-white mb-4">Most Active Hours</h3>
              <div className="flex items-end gap-1 h-20">
                {stats.messagesByHour.map((h, i) => {
                  const max = Math.max(...stats.messagesByHour.map((x) => x.count));
                  const pct = max > 0 ? (h.count / max) * 100 : 0;
                  return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm transition-all duration-500" style={{ height: `${pct}%`, minHeight: 2, backgroundColor: "#22c55e", opacity: 0.4 + pct / 200 }} />
                      {i % 4 === 0 && <span className="text-[8px] text-gray-600">{h.hour}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-medium text-white">Insights</h3>
              {[
                { icon: "📅", label: "Most active day", value: stats.mostActiveDay },
                { icon: "🕐", label: "Most active hour", value: stats.mostActiveHour },
                { icon: "💬", label: "Most chatted with", value: stats.topContact },
                { icon: "⚡", label: "Avg response time", value: stats.avgResponseTime },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className="text-sm text-gray-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
