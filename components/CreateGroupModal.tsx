"use client";

import { useState } from "react";
import { User } from "@/types";
import { createGroup } from "@/lib/api";

interface Props {
  users: User[];
  myId: string;
  onClose: () => void;
  onCreated: (group: any) => void;
}

export default function CreateGroupModal({ users, myId, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError("Group name is required"); return; }
    if (selected.size === 0) { setError("Add at least one member"); return; }
    setLoading(true);
    try {
      const group = await createGroup(name.trim(), description.trim(), myId, Array.from(selected));
      onCreated(group);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 className="text-white font-semibold text-lg">New Group</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Group icon placeholder */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border-2 border-dashed border-brand-500/40 flex items-center justify-center text-3xl">
              👥
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Group Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team"
              className="w-full bg-surface-raised border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full bg-surface-raised border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          {/* Members */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">
              Add Members ({selected.size} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-surface-raised rounded-xl p-2 border border-surface-border">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => toggle(user._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all
                    ${selected.has(user._id) ? "bg-brand-500/15 border border-brand-500/30" : "hover:bg-surface-border"}`}
                >
                  <div className="relative flex-shrink-0">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-surface-border flex items-center justify-center text-xs font-semibold text-gray-300">
                        {user.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-white flex-1 text-left truncate">{user.name}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${selected.has(user._id) ? "bg-brand-500 border-brand-500" : "border-gray-600"}`}>
                    {selected.has(user._id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-surface-border text-gray-400 text-sm hover:bg-surface-raised transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
