"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

const I = {
  Back:   () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Plus:   () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  Camera: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Text:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 10H3M21 6H3M21 14H3M17 18H3"/></svg>,
  Close:  () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Mute:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  View:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Send:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>,
};

const STORY_COLORS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)",
  "linear-gradient(135deg,#ff9a9e,#fecfef)",
];

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  } catch { return ""; }
}

interface Story {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  type: "image" | "text";
  content: string;
  bg?: string;
  createdAt: string;
  views: number;
  seen: boolean;
}

interface StoryGroup {
  userId: string;
  userName: string;
  userImage: string;
  stories: Story[];
  hasUnseen: boolean;
}

export default function StoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [activeGroup, setActiveGroup] = useState<StoryGroup | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showAddStory, setShowAddStory] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [selectedBg, setSelectedBg] = useState(STORY_COLORS[0]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [replyText, setReplyText] = useState("");
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Demo stories
  const [demoGroups] = useState<StoryGroup[]>([
    {
      userId: "demo1", userName: "Adhi Aadhi", userImage: "",
      hasUnseen: true,
      stories: [{
        id: "s1", userId: "demo1", userName: "Adhi Aadhi", userImage: "",
        type: "text", content: "Good morning! 🌅", bg: STORY_COLORS[0],
        createdAt: new Date(Date.now() - 3600000).toISOString(), views: 12, seen: false,
      }],
    },
    {
      userId: "demo2", userName: "Prakash", userImage: "",
      hasUnseen: true,
      stories: [{
        id: "s2", userId: "demo2", userName: "Prakash", userImage: "",
        type: "text", content: "Working on something big! 🚀", bg: STORY_COLORS[3],
        createdAt: new Date(Date.now() - 7200000).toISOString(), views: 8, seen: false,
      }],
    },
  ]);

  const myGroup: StoryGroup | null = myStories.length > 0 ? {
    userId: user?.id || "me", userName: user?.name || "You",
    userImage: user?.image || "",
    stories: myStories, hasUnseen: false,
  } : null;

  const allGroups = myGroup ? [myGroup, ...demoGroups] : demoGroups;

  const openStory = (group: StoryGroup, idx = 0) => {
    setActiveGroup(group);
    setActiveIndex(idx);
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressRef.current!);
          // Next story or close
          if (idx < group.stories.length - 1) {
            openStory(group, idx + 1);
          } else {
            setActiveGroup(null);
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
  };

  const closeStory = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setActiveGroup(null);
    setProgress(0);
  };

  const addTextStory = () => {
    if (!storyText.trim()) return;
    const newStory: Story = {
      id: `my-${Date.now()}`, userId: user?.id || "me",
      userName: user?.name || "You", userImage: user?.image || "",
      type: "text", content: storyText, bg: selectedBg,
      createdAt: new Date().toISOString(), views: 0, seen: false,
    };
    setMyStories((p) => [...p, newStory]);
    setStoryText(""); setShowAddStory(false);
  };

  const Avatar = ({ name, image, size = 56 }: { name: string; image?: string; size?: number }) => (
    image
      ? <img src={image} alt={name} className="w-full h-full object-cover rounded-full" />
      : <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-lg"
          style={{ background: "var(--brand)" }}>{name[0]?.toUpperCase()}</div>
  );

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 h-16 flex-shrink-0"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--divider)" }}>
        <button onClick={() => router.push("/chat")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          style={{ color: "var(--text-secondary)" }}>
          <I.Back />
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: "var(--text-primary)" }}>Status</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Story */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--divider)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            My Status
          </p>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => myGroup ? openStory(myGroup) : setShowAddStory(true)}>
              <div className="w-14 h-14 rounded-full overflow-hidden"
                style={{ border: myGroup ? "2px solid var(--brand)" : "2px dashed var(--text-muted)" }}>
                <Avatar name={user?.name || "Me"} image={user?.image} />
              </div>
              {!myGroup && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "var(--brand)", color: "#fff" }}>
                  <I.Plus />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                {myGroup ? "My status" : "Add status update"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {myGroup ? `${myStories.length} update${myStories.length > 1 ? "s" : ""}` : "Tap to add status"}
              </p>
            </div>
            <button onClick={() => setShowAddStory(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
              style={{ color: "var(--brand)" }}>
              <I.Plus />
            </button>
          </div>
        </div>

        {/* Recent Updates */}
        {allGroups.filter(g => g.userId !== (user?.id || "me")).length > 0 && (
          <div className="px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Recent Updates
            </p>
            {demoGroups.map((group) => (
              <button key={group.userId}
                onClick={() => openStory(group)}
                className="w-full flex items-center gap-4 py-3 transition-all hover:bg-white/5 rounded-xl px-2"
                style={{ borderBottom: "1px solid var(--divider)" }}>
                <div className="relative w-14 h-14 flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden p-0.5"
                    style={{ background: group.hasUnseen ? "var(--brand)" : "var(--text-muted)" }}>
                    <div className="w-full h-full rounded-full overflow-hidden"
                      style={{ border: "2px solid var(--bg-app)" }}>
                      <Avatar name={group.userName} image={group.userImage} size={56} />
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>{group.userName}</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(group.stories[group.stories.length - 1].createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {allGroups.filter(g => g.userId !== (user?.id || "me")).length === 0 && !myGroup && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-header)" }}>
              <I.Camera />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg mb-1" style={{ color: "var(--text-primary)" }}>No status updates</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tap the + button to add your status</p>
            </div>
          </div>
        )}
      </div>

      {/* Story Viewer */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
          {/* Progress bars */}
          <div className="flex gap-1 px-3 pt-safe pt-3 pb-2 z-10">
            {activeGroup.stories.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.3)" }}>
                <div className="h-full rounded-full transition-none"
                  style={{
                    background: "#fff",
                    width: i < activeIndex ? "100%" : i === activeIndex ? `${progress}%` : "0%",
                  }} />
              </div>
            ))}
          </div>

          {/* Story header */}
          <div className="flex items-center gap-3 px-4 py-2 z-10">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Avatar name={activeGroup.userName} image={activeGroup.userImage} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{activeGroup.userName}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                {timeAgo(activeGroup.stories[activeIndex].createdAt)}
              </p>
            </div>
            <button onClick={closeStory} className="w-10 h-10 flex items-center justify-center" style={{ color: "#fff" }}>
              <I.Close />
            </button>
          </div>

          {/* Story content */}
          <div className="flex-1 flex items-center justify-center"
            style={{ background: activeGroup.stories[activeIndex].bg || "#000" }}
            onClick={(e) => {
              const x = e.clientX;
              const w = window.innerWidth;
              if (x < w / 3) {
                if (activeIndex > 0) openStory(activeGroup, activeIndex - 1);
              } else if (x > (2 * w) / 3) {
                if (activeIndex < activeGroup.stories.length - 1) openStory(activeGroup, activeIndex + 1);
                else closeStory();
              }
            }}>
            {activeGroup.stories[activeIndex].type === "text" ? (
              <p className="text-white text-2xl font-bold text-center px-8 leading-relaxed">
                {activeGroup.stories[activeIndex].content}
              </p>
            ) : (
              <img src={activeGroup.stories[activeIndex].content} alt="" className="w-full h-full object-contain" />
            )}
          </div>

          {/* Views + Reply */}
          <div className="flex items-center gap-3 px-4 py-4 pb-safe" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              <I.View />
              <span className="text-sm">{activeGroup.stories[activeIndex].views}</span>
            </div>
            <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to status…"
              className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-full px-4 py-2 text-sm outline-none" />
            {replyText && (
              <button onClick={() => setReplyText("")}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "var(--brand)" }}>
                <I.Send />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {showAddStory && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddStory(false); }}>
          <div className="w-full rounded-t-3xl p-6 animate-slide-up"
            style={{ background: "var(--bg-header)" }}>
            <p className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Add Status</p>

            <div className="flex gap-3 mb-4">
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all hover:bg-white/10"
                style={{ background: "var(--bg-input)" }}>
                <I.Camera />
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>Photo</span>
              </button>
              <button onClick={() => {}}
                className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all hover:bg-white/10"
                style={{ background: "var(--bg-input)" }}>
                <I.Text />
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>Text</span>
              </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" />

            {/* Text story composer */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: selectedBg, minHeight: 120 }}>
              <textarea value={storyText} onChange={(e) => setStoryText(e.target.value)}
                placeholder="Type your status…"
                className="w-full bg-transparent text-white placeholder-white/60 outline-none resize-none text-center text-xl font-bold leading-relaxed"
                rows={3} />
            </div>

            {/* BG picker */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {STORY_COLORS.map((bg) => (
                <button key={bg} onClick={() => setSelectedBg(bg)}
                  className="w-8 h-8 rounded-full flex-shrink-0 transition-all"
                  style={{ background: bg, border: selectedBg === bg ? "3px solid white" : "3px solid transparent" }} />
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAddStory(false)}
                className="flex-1 py-3 rounded-2xl font-semibold"
                style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button onClick={addTextStory} disabled={!storyText.trim()}
                className="flex-1 py-3 rounded-2xl font-semibold"
                style={{ background: storyText.trim() ? "var(--brand)" : "var(--bg-input)", color: "#fff" }}>
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
