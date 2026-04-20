"use client";

import { signOut } from "next-auth/react";
import { User } from "@/types";

interface Props {
  currentUser: User & { id: string };
  users: User[];
  selectedUser: User | null;
  onlineUsers: string[];
  onSelectUser: (user: User) => void;
}

export default function Sidebar({
  currentUser,
  users,
  selectedUser,
  onlineUsers,
  onSelectUser,
}: Props) {
  return (
    <aside className="w-72 flex-shrink-0 border-r border-surface-border bg-surface-card flex flex-col">
      {/* App header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-surface-border">
        <span className="font-semibold text-white tracking-tight">
          Pulse<span className="text-brand-500">Chat</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-500" />
          <span className="text-xs text-gray-400">
            {onlineUsers.length} online
          </span>
        </div>
      </div>

      {/* Search placeholder */}
      <div className="px-3 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm text-gray-600">Search contacts…</span>
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto py-2">
        <p className="px-4 pb-1 text-xs font-medium text-gray-600 uppercase tracking-wider">
          Direct Messages
        </p>
        {users.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-600">
            No other users yet
          </div>
        ) : (
          users.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const isSelected = selectedUser?._id === user._id;
            return (
              <button
                key={user._id}
                onClick={() => onSelectUser(user)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all duration-100
                  ${isSelected
                    ? "bg-brand-500/10 text-white"
                    : "hover:bg-surface-raised text-gray-300"
                  }`}
                style={{ width: "calc(100% - 8px)" }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center text-sm font-semibold text-gray-300">
                      {user.name[0].toUpperCase()}
                    </div>
                  )}
                  {/* Online dot */}
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-card transition-colors
                      ${isOnline ? "bg-brand-500" : "bg-gray-600"}`}
                  />
                </div>

                {/* Name + status */}
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium truncate max-w-full">
                    {user.name}
                  </span>
                  <span className={`text-xs ${isOnline ? "text-brand-500" : "text-gray-600"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Current user footer */}
      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {currentUser.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.image}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 text-sm font-semibold">
                {currentUser.name?.[0]}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-brand-500 border-2 border-surface-card rounded-full" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium text-white truncate">
              {currentUser.name}
            </span>
            <span className="text-xs text-gray-600 truncate">
              {currentUser.email}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
