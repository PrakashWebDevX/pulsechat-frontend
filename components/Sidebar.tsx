"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Group, ChatTarget } from "@/types";
import CreateGroupModal from "./CreateGroupModal";

interface Props {
  currentUser: User & { id: string };
  users: User[];
  groups: Group[];
  selectedTarget: ChatTarget | null;
  onlineUsers: string[];
  onSelectTarget: (target: ChatTarget) => void;
  onGroupCreated: (group: Group) => void;
}

export default function Sidebar({ currentUser, users, groups, selectedTarget, onlineUsers, onSelectTarget, onGroupCreated }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"chats" | "groups">("chats");
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const selectedId =
    selectedTarget?.kind === "user" ? selectedTarget.data._id :
    selectedTarget?.kind === "group" ? selectedTarget.data._id : null;

  return (
    <>
      <aside className="w-full md:w-72 flex-shrink-0 border-r border-surface-border bg-surface-card flex flex-col h-full">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-border flex-shrink-0">
          <span className="font-semibold text-white tracking-tight text-lg">
            Pulse<span className="text-brand-500">Chat</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{onlineUsers.length} online</span>
            {/* New group */}
            <button onClick={() => setShowCreateGroup(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
              title="New Group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-border flex-shrink-0">
          {(["chats", "groups"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors
                ${tab === t ? "text-brand-500 border-b-2 border-brand-500" : "text-gray-500 hover:text-gray-300"}`}
            >
              {t === "chats" ? `💬 Chats` : `👥 Groups (${groups.length})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {tab === "chats" ? (
            users.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-600">No users yet</div>
            ) : users.map((user) => {
              const isOnline = onlineUsers.includes(user._id);
              const isSelected = selectedId === user._id;
              return (
                <button key={user._id} onClick={() => onSelectTarget({ kind: "user", data: user })}
                  className={`w-full flex items-center gap-3 px-3 py-3 mx-1 rounded-xl transition-all active:scale-95
                    ${isSelected ? "bg-brand-500/10 text-white" : "hover:bg-surface-raised text-gray-300"}`}
                  style={{ width: "calc(100% - 8px)" }}
                >
                  <div className="relative flex-shrink-0">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.name} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-surface-raised flex items-center justify-center text-sm font-semibold">
                        {user.name[0]}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-card ${isOnline ? "bg-brand-500" : "bg-gray-600"}`} />
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-sm font-medium truncate w-full">{user.name}</span>
                    <span className={`text-xs ${isOnline ? "text-brand-500" : "text-gray-600"}`}>{isOnline ? "● Online" : "○ Offline"}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 flex-shrink-0 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })
          ) : (
            <>
              <button onClick={() => setShowCreateGroup(true)}
                className="w-full mx-1 flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-raised text-brand-500 transition-all"
                style={{ width: "calc(100% - 8px)" }}
              >
                <div className="w-11 h-11 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-xl">+</div>
                <span className="text-sm font-medium">Create New Group</span>
              </button>

              {groups.length === 0 ? (
                <div className="px-4 py-4 text-center text-sm text-gray-600">No groups yet</div>
              ) : groups.map((group) => {
                const isSelected = selectedId === group._id;
                return (
                  <button key={group._id} onClick={() => onSelectTarget({ kind: "group", data: group })}
                    className={`w-full flex items-center gap-3 px-3 py-3 mx-1 rounded-xl transition-all active:scale-95
                      ${isSelected ? "bg-brand-500/10 text-white" : "hover:bg-surface-raised text-gray-300"}`}
                    style={{ width: "calc(100% - 8px)" }}
                  >
                    <div className="w-11 h-11 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center text-xl flex-shrink-0">
                      {group.avatar || "👥"}
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="text-sm font-medium truncate w-full">{group.name}</span>
                      <span className="text-xs text-gray-600">{group.members.length} members</span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-border p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/profile")} className="relative flex-shrink-0">
              {currentUser?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUser.image} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent hover:ring-brand-500 transition-all" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 font-semibold">
                  {currentUser?.name?.[0] || "?"}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-500 border-2 border-surface-card rounded-full" />
            </button>
            <div className="flex flex-col min-w-0 flex-1">
              <button onClick={() => router.push("/profile")} className="text-sm font-medium text-white truncate text-left hover:text-brand-500 transition-colors">
                {currentUser?.name}
              </button>
              <span className="text-xs text-gray-600 truncate">{currentUser?.email}</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} title="Sign out"
              className="flex-shrink-0 p-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {showCreateGroup && (
        <CreateGroupModal
          users={users}
          myId={currentUser.id}
          onClose={() => setShowCreateGroup(false)}
          onCreated={(g) => { onGroupCreated(g); setTab("groups"); }}
        />
      )}
    </>
  );
}
