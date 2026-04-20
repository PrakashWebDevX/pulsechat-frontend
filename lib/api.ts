import { User, Message, Group } from "@/types";

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Users ──────────────────────────────────────────────────────────────────
export const fetchUsers = (excludeId: string) =>
  apiFetch<User[]>(`/api/users?excludeId=${excludeId}`);

export const upsertUser = (name: string, email: string, image: string) =>
  apiFetch<User>("/api/users/upsert", { method: "POST", body: JSON.stringify({ name, email, image }) });

export const updateProfile = (id: string, data: Partial<Pick<User, "name" | "bio" | "username" | "image">>) =>
  apiFetch<User>(`/api/users/${id}/profile`, { method: "PATCH", body: JSON.stringify(data) });

export const savePushToken = (userId: string, token: string) =>
  apiFetch(`/api/users/${userId}/push-token`, { method: "POST", body: JSON.stringify({ token }) });

// ── Messages ───────────────────────────────────────────────────────────────
export const fetchMessages = (myId: string, partnerId: string) =>
  apiFetch<Message[]>(`/api/messages/${partnerId}?myId=${myId}`);

export const postMessage = (
  senderId: string, receiverId: string, message: string,
  extras?: Partial<Pick<Message, "type" | "fileUrl" | "fileName" | "fileSize" | "duration" | "replyTo">>
) => apiFetch<Message>("/api/messages", { method: "POST", body: JSON.stringify({ senderId, receiverId, message, ...extras }) });

export const editMessage = (id: string, message: string) =>
  apiFetch<Message>(`/api/messages/${id}/edit`, { method: "PATCH", body: JSON.stringify({ message }) });

export const deleteMessage = (id: string) =>
  apiFetch<Message>(`/api/messages/${id}/delete`, { method: "PATCH" });

export const reactToMessage = (id: string, userId: string, emoji: string) =>
  apiFetch<Message>(`/api/messages/${id}/react`, { method: "PATCH", body: JSON.stringify({ userId, emoji }) });

// ── Groups ─────────────────────────────────────────────────────────────────
export const fetchGroups = (userId: string) =>
  apiFetch<Group[]>(`/api/groups?userId=${userId}`);

export const createGroup = (name: string, description: string, createdBy: string, memberIds: string[]) =>
  apiFetch<Group>("/api/groups", { method: "POST", body: JSON.stringify({ name, description, createdBy, memberIds }) });

export const fetchGroupMessages = (groupId: string) =>
  apiFetch<Message[]>(`/api/groups/${groupId}/messages`);

export const postGroupMessage = (
  groupId: string, senderId: string, message: string,
  extras?: Partial<Pick<Message, "type" | "fileUrl" | "fileName" | "fileSize" | "replyTo">>
) => apiFetch<Message>(`/api/groups/${groupId}/messages`, { method: "POST", body: JSON.stringify({ senderId, message, ...extras }) });

export const addGroupMember = (groupId: string, userId: string) =>
  apiFetch<Group>(`/api/groups/${groupId}/members`, { method: "POST", body: JSON.stringify({ userId }) });

export const removeGroupMember = (groupId: string, userId: string) =>
  apiFetch<Group>(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
