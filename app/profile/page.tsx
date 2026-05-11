"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

const I = {
  Back:    () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Camera:  () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Edit:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Check:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Close:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const BIOS = ["Available", "Busy", "At school", "At the gym", "In a meeting", "Do not disturb", "On vacation"];

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState("Available");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState(user?.image || "");
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, name, bio, phone, image: photoUrl }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

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
        <h1 className="text-xl font-bold flex-1" style={{ color: "var(--text-primary)" }}>Profile</h1>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95"
          style={{ background: saved ? "#22c55e" : "var(--brand)", color: "#fff" }}>
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center py-8"
          style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--divider)" }}>
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-28 h-28 rounded-full object-cover" />
            ) : (
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                style={{ background: "var(--brand)" }}>
                {name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(0,0,0,0.4)" }}>
              <div style={{ color: "#fff" }}><I.Camera /></div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>Tap to change photo</p>
        </div>

        {/* Name */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--divider)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--brand)" }}>
            Your name
          </p>
          {editingName ? (
            <div className="flex items-center gap-3">
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-lg outline-none border-b-2 pb-1"
                style={{ color: "var(--text-primary)", borderColor: "var(--brand)" }}
                maxLength={30}
                onKeyDown={(e) => { if (e.key === "Enter") setEditingName(false); if (e.key === "Escape") setEditingName(false); }} />
              <button onClick={() => setEditingName(false)} style={{ color: "var(--brand)" }}><I.Check /></button>
              <button onClick={() => { setName(user?.name || ""); setEditingName(false); }} style={{ color: "var(--text-muted)" }}><I.Close /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg" style={{ color: "var(--text-primary)" }}>{name || "Add your name"}</p>
              <button onClick={() => setEditingName(true)} style={{ color: "var(--text-muted)" }}><I.Edit /></button>
            </div>
          )}
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {30 - name.length} characters remaining
          </p>
        </div>

        {/* Bio */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--divider)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--brand)" }}>
            About
          </p>
          {editingBio ? (
            <div>
              <input autoFocus value={bio} onChange={(e) => setBio(e.target.value)}
                className="w-full bg-transparent text-base outline-none border-b-2 pb-1 mb-3"
                style={{ color: "var(--text-primary)", borderColor: "var(--brand)" }}
                maxLength={139}
                onKeyDown={(e) => { if (e.key === "Enter") setEditingBio(false); }} />
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                {139 - bio.length} characters remaining
              </p>
              <div className="flex flex-wrap gap-2">
                {BIOS.map((b) => (
                  <button key={b} onClick={() => { setBio(b); setEditingBio(false); }}
                    className="px-3 py-1.5 rounded-full text-sm transition-all"
                    style={{ background: bio === b ? "var(--brand)" : "var(--bg-input)", color: bio === b ? "#fff" : "var(--text-secondary)" }}>
                    {b}
                  </button>
                ))}
              </div>
              <button onClick={() => setEditingBio(false)}
                className="mt-3 px-4 py-2 rounded-xl font-medium text-sm"
                style={{ background: "var(--brand)", color: "#fff" }}>
                Done
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p style={{ color: "var(--text-primary)" }}>{bio || "Add your bio"}</p>
              <button onClick={() => setEditingBio(true)} style={{ color: "var(--text-muted)" }}><I.Edit /></button>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--divider)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--brand)" }}>
            Phone number
          </p>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 99999 99999"
            type="tel"
            className="w-full bg-transparent text-base outline-none border-b pb-1"
            style={{ color: "var(--text-primary)", borderColor: "var(--divider)" }} />
        </div>

        {/* Email (read only) */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--divider)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--brand)" }}>
            Email
          </p>
          <p style={{ color: "var(--text-muted)" }}>{user?.email}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Email cannot be changed (managed by Google)
          </p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
