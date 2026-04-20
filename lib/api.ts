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

export async function fetchUsers(excludeId: string): Promise<User[]> {
  return apiFetch<User[]>(`/api/users?excludeId=${excludeId}`);
}

export async function fetchMessages(
  myId: string,
  partnerId: string
): Promise<Message[]> {
  return apiFetch<Message[]>(`/api/messages/${partnerId}?myId=${myId}`);
}

export async function postMessage(
  senderId: string,
  receiverId: string,
  message: string
): Promise<Message> {
  return apiFetch<Message>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ senderId, receiverId, message }),
  });
}

export async function upsertUser(
  name: string,
  email: string,
  image: string
): Promise<User> {
  return apiFetch<User>("/api/users/upsert", {
    method: "POST",
    body: JSON.stringify({ name, email, image }),
  });
}
