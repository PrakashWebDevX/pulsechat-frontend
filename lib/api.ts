import { User, Message } from "@/types";

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

export const fetchUsers = (excludeId: string) =>
  apiFetch<User[]>(`/api/users?excludeId=${excludeId}`);

export const fetchMessages = (myId: string, partnerId: string) =>
  apiFetch<Message[]>(`/api/messages/${partnerId}?myId=${myId}`);

export const postMessage = (
  senderId: string,
  receiverId: string,
  message: string,
  extras?: Partial<Pick<Message, "type" | "fileUrl" | "fileName" | "fileSize" | "replyTo">>
) =>
  apiFetch<Message>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ senderId, receiverId, message, ...extras }),
  });

export const editMessage = (id: string, message: string) =>
  apiFetch<Message>(`/api/messages/${id}/edit`, {
    method: "PATCH",
    body: JSON.stringify({ message }),
  });

export const deleteMessage = (id: string) =>
  apiFetch<Message>(`/api/messages/${id}/delete`, { method: "PATCH" });

export const reactToMessage = (id: string, userId: string, emoji: string) =>
  apiFetch<Message>(`/api/messages/${id}/react`, {
    method: "PATCH",
    body: JSON.stringify({ userId, emoji }),
  });

export const markAsRead = (senderId: string, receiverId: string) =>
  apiFetch("/api/messages/read", {
    method: "PATCH",
    body: JSON.stringify({ senderId, receiverId }),
  });

export const upsertUser = (name: string, email: string, image: string) =>
  apiFetch<User>("/api/users/upsert", {
    method: "POST",
    body: JSON.stringify({ name, email, image }),
  });
