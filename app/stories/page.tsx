"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

const BG_COLORS = [
  "#16a34a","#2563eb","#7c3aed","#db2777","#ea580c",
  "#0891b2","#65a30d","#dc2626","#9333ea","#0d9488",
];

interface Story { _id: string; type: string; content: string; caption: string; bg: string; views: any[]; createdAt: string; }
interface StoryGroup { user: { _id: string; name: string; image: string }; stories: Story[]; hasUnseen: boolean; }

export default function StoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewing, setViewing] = useState<StoryGroup | null>(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [creating, setCreating] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyBg, setStoryBg] = useState(BG_COLORS[0]);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);

  const myId = (session?.user as any)?.id;

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (myId) loadStories(); }, [myId]);

  const loadStories = async () => {
    try {
      const res = await fetch(`${BASE}/api/stories?userId=${myId}`);
      const data = await res.json();
      setGroups(data);
    } catch {}
  };

  const handleView = (group: StoryGroup) => {
    setViewing(group);
    setViewIdx(0);
    setProgress(0);
    markViewed(group.stories[0]);
    startProgress();
  };

  const startProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressRef.current!);
          return 100;
        }
        return p + (100 / 50); // 5 seconds per story
      });
    }, 100);
  };

  useEffect(() => {
    if (progress >= 100 && viewing) {
      const next = viewIdx + 1;
      if (next < viewing.stories.length) {
        setViewIdx(next);
        setProgress(0);
        markViewed(viewing.stories[next]);
        startProgress();
      } else {
        setViewing(null);
        if (progressRef.current) clearInterval(progressRef.current);
      }
    }
  }, [progress]);

  const markViewed = async (story: Story) => {
    try {
      await fetch(`${BASE}/api/stories/${story._id}/view`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: myId }),
      });
    } catch {}
  };

  const handlePost = async () => {
    if (!myId || (!storyText.trim() && !storyImage)) return;
    setPosting(true);
    try {
      await fetch(`${BASE}/api/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: myId,
          type: storyImage ? "image" : "text",
          content: storyImage || storyText.trim(),
          caption: storyImage ? storyText : "",
          bg: storyBg,
        }),
      });
      setCreating(false);
      setStoryText("");
      setStoryImage(null);
      loadStories();
    } catch {} finally { setPosting(false); }
  };

  if (status === "loading") return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const currentStory = viewing?.stories[viewIdx];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="h-16 border-b border-surface-border bg-surface-card flex items-center gap-4 px-4">
        <button onClick={() => router.push("/chat")}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-white font-semibold flex-1">Stories</h1>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-xl transition-colors">
          <span>+</span> Add Story
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Story rings */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add story button */}
          <button onClick={() => setCreating(true)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-surface-raised border-2 border-dashed border-brand-500/40 flex items-center justify-center text-2xl hover:border-brand-500 transition-colors">
              +
            </div>
            <span className="text-xs text-gray-500">Your Story</span>
          </button>

          {groups.map((group) => (
            <button key={group.user._id} onClick={() => handleView(group)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-16 h-16 rounded-full p-0.5 ${group.hasUnseen ? "bg-gradient-to-tr from-brand-500 to-blue-500" : "bg-surface-border"}`}>
                <div className="w-full h-full rounded-full border-2 border-surface overflow-hidden">
                  {group.user.image
                    ? <img src={group.user.image} alt={group.user.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-brand-500/20 flex items-center justify-center text-lg font-bold text-brand-500">{group.user.name[0]}</div>
                  }
                </div>
              </div>
              <span className="text-xs text-gray-400 max-w-[64px] truncate">{group.user.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center text-3xl">📸</div>
            <p className="text-gray-500 text-sm">No stories yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* Story viewer */}
      {viewing && currentStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in" onClick={() => { setViewing(null); if (progressRef.current) clearInterval(progressRef.current); }}>
          {/* Progress bars */}
          <div className="flex gap-1 p-3 z-10">
            {viewing.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-none"
                  style={{ width: i < viewIdx ? "100%" : i === viewIdx ? `${progress}%` : "0%" }} />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-4 pb-4 z-10">
            {viewing.user.image
              ? <img src={viewing.user.image} alt={viewing.user.name} className="w-9 h-9 rounded-full object-cover" />
              : <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white">{viewing.user.name[0]}</div>
            }
            <div>
              <p className="text-white text-sm font-medium">{viewing.user.name}</p>
              <p className="text-white/60 text-xs">{new Date(currentStory.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>

          {/* Story content */}
          <div className="flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {currentStory.type === "image"
              ? <img src={currentStory.content} alt="story" className="max-w-full max-h-full object-contain" />
              : <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: currentStory.bg }}>
                  <p className="text-white text-3xl font-semibold text-center leading-relaxed">{currentStory.content}</p>
                </div>
            }
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <p className="text-white text-center px-6 pb-8 text-sm">{currentStory.caption}</p>
          )}

          {/* Tap zones */}
          <div className="absolute inset-0 flex">
            <div className="flex-1" onClick={(e) => { e.stopPropagation(); if (viewIdx > 0) { setViewIdx(v => v - 1); startProgress(); } }} />
            <div className="flex-1" onClick={(e) => { e.stopPropagation(); const next = viewIdx + 1; if (next < viewing.stories.length) { setViewIdx(next); startProgress(); } else setViewing(null); }} />
          </div>
        </div>
      )}

      {/* Create story modal */}
      {creating && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h2 className="text-white font-semibold">Create Story</h2>
              <button onClick={() => { setCreating(false); setStoryImage(null); setStoryText(""); }} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview */}
              <div className="w-full h-40 rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: storyImage ? "#000" : storyBg }}>
                {storyImage
                  ? <img src={storyImage} alt="preview" className="max-w-full max-h-full object-contain" />
                  : <p className="text-white text-xl font-semibold text-center px-4">{storyText || "Your story here…"}</p>
                }
              </div>

              {/* Text input */}
              <textarea value={storyText} onChange={(e) => setStoryText(e.target.value.slice(0, 120))}
                placeholder={storyImage ? "Add a caption…" : "Type something…"}
                rows={2}
                className="w-full bg-surface-raised border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors resize-none" />

              {/* Background colors (text stories only) */}
              {!storyImage && (
                <div className="flex gap-2 flex-wrap">
                  {BG_COLORS.map((c) => (
                    <button key={c} onClick={() => setStoryBg(c)}
                      className={`w-7 h-7 rounded-full transition-all ${storyBg === c ? "ring-2 ring-white scale-110" : ""}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}

              {/* Image upload */}
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="flex-1 py-2 rounded-xl border border-surface-border text-gray-400 text-sm hover:bg-surface-raised transition-colors flex items-center justify-center gap-2">
                  📷 {storyImage ? "Change Image" : "Add Image"}
                </button>
                {storyImage && (
                  <button onClick={() => setStoryImage(null)}
                    className="px-3 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">✕</button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader(); r.onload = () => setStoryImage(r.result as string); r.readAsDataURL(f);
                  e.target.value = "";
                }} />
            </div>

            <div className="px-5 pb-5">
              <button onClick={handlePost} disabled={posting || (!storyText.trim() && !storyImage)}
                className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {posting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Share Story"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
