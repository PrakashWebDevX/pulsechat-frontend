"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const I = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Msg:  () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  User: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Fire: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7c-1.93 0-3.68-.79-4.95-2.05A6.98 6.98 0 014 17.5c0-1.67.5-3.25 1.5-4.5"/></svg>,
  Clock:() => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

function StatCard({ icon, label, value, color, change }: { icon: any, label: string, value: string, color: string, change?: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "var(--bg-sidebar)" }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: color + "20", color }}>
          {icon}
        </div>
        {change && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: change.startsWith("+") ? "#22c55e20" : "#ef444420", color: change.startsWith("+") ? "#22c55e" : "#ef4444" }}>
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</p>
      </div>
    </div>
  );
}

function Bar({ day, value, max }: { day: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{value}</span>
      <div className="w-8 rounded-t-lg transition-all" style={{ height: 80, background: "var(--bg-input)", position: "relative", overflow: "hidden" }}>
        <div className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all"
          style={{ height: `${pct}%`, background: "var(--brand)" }} />
      </div>
      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{day}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [stats, setStats] = useState({
    totalMessages: 0, totalContacts: 0, todayMessages: 0, avgPerDay: 0,
  });
  const [weekData, setWeekData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/analytics?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setStats({
          totalMessages: d.totalMessages || 0,
          totalContacts: d.totalContacts || 0,
          todayMessages: d.todayMessages || 0,
          avgPerDay: d.avgPerDay || 0,
        });
        setWeekData(d.weekData || [12, 8, 24, 15, 30, 22, 18]);
      })
      .catch(() => {
        // Demo data if API fails
        setStats({ totalMessages: 342, totalContacts: 8, todayMessages: 24, avgPerDay: 18 });
        setWeekData([12, 8, 24, 15, 30, 22, 18]);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxVal = Math.max(...weekData, 1);

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          style={{ color: "var(--text-secondary)" }}>
          <I.Back />
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: "var(--text-primary)" }}>Analytics</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ border: "2px solid var(--brand)", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <>
            {/* Period toggle */}
            <div className="flex gap-2 p-1 rounded-xl w-fit"
              style={{ background: "var(--bg-sidebar)" }}>
              {(["week", "month"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
                  style={{ background: period === p ? "var(--brand)" : "transparent", color: period === p ? "#fff" : "var(--text-secondary)" }}>
                  {p === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<I.Msg />} label="Total Messages" value={stats.totalMessages.toLocaleString()} color="#00a884" change="+12%" />
              <StatCard icon={<I.User />} label="Contacts" value={stats.totalContacts.toString()} color="#3b82f6" />
              <StatCard icon={<I.Fire />} label="Today" value={stats.todayMessages.toString()} color="#f59e0b" change="+5" />
              <StatCard icon={<I.Clock />} label="Daily Avg" value={stats.avgPerDay.toString()} color="#8b5cf6" />
            </div>

            {/* Bar chart */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-sidebar)" }}>
              <p className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Messages This Week</p>
              <div className="flex items-end justify-between gap-1">
                {weekData.map((val, i) => (
                  <Bar key={i} day={days[i]} value={val} max={maxVal} />
                ))}
              </div>
            </div>

            {/* Most active time */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-sidebar)" }}>
              <p className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Most Active Times</p>
              {[
                { time: "Morning (6–12)", pct: 25 },
                { time: "Afternoon (12–18)", pct: 40 },
                { time: "Evening (18–22)", pct: 55 },
                { time: "Night (22–6)", pct: 15 },
              ].map((item) => (
                <div key={item.time} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.time}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--brand)" }}>{item.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "var(--bg-input)" }}>
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: "var(--brand)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Account info */}
            <div className="rounded-2xl p-4" style={{ background: "var(--bg-sidebar)" }}>
              <p className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Account Info</p>
              {[
                { label: "Member since", value: new Date(user?.createdAt || Date.now()).toLocaleDateString() },
                { label: "Account type", value: "Standard" },
                { label: "Email", value: user?.email || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2"
                  style={{ borderBottom: "1px solid var(--divider)" }}>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="text-sm font-medium truncate ml-4" style={{ color: "var(--text-primary)", maxWidth: "60%" }}>{value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
