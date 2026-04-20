"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { updateProfile } from "@/lib/api";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const myId = (session?.user as any)?.id;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session?.user) {
      setName((session.user as any).name || "");
      setImage((session.user as any).image || "");
    }
  }, [session, status, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!myId || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateProfile(myId, { name: name.trim(), bio, username, image });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="h-16 border-b border-surface-border bg-surface-card flex items-center gap-4 px-4">
        <button onClick={() => router.push("/chat")}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white font-semibold">Edit Profile</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-surface-border" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-brand-500/20 flex items-center justify-center text-3xl font-bold text-brand-500">
                {name[0] || "?"}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-brand-600 transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          <p className="text-xs text-gray-500">Tap the camera to change photo</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors" />
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="yourhandle"
                className="w-full bg-surface-card border border-surface-border rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">
              Bio <span className="text-gray-600">({bio.length}/150)</span>
            </label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 150))}
              rows={3} placeholder="Tell people about yourself…"
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors resize-none" />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Email</label>
            <input value={(session?.user as any)?.email || ""} readOnly
              className="w-full bg-surface-raised border border-surface-border rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Save */}
        <button onClick={handleSave} disabled={saving || !name.trim()}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all
            ${saved ? "bg-green-500 text-white" : "bg-brand-500 hover:bg-brand-600 text-white"}
            disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
          ) : saved ? (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Saved!</>
          ) : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
