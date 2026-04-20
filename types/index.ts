export interface User {
  _id: string;
  name: string;
  email: string;
  image: string;
  bio?: string;
  username?: string;
  createdAt: string;
}

export interface GroupMember {
  userId: User;
  role: "admin" | "member";
  joinedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Message {
  _id: string;
  senderId: string | User;
  receiverId?: string;
  groupId?: string;
  message: string;
  type: "text" | "image" | "file" | "audio";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: {
    _id: string;
    message: string;
    senderId: string;
    type: string;
  };
  reactions: Reaction[];
  status: "sent" | "delivered" | "read";
  edited: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocketMessage {
  messageId: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  senderName?: string;
  senderImage?: string;
  message: string;
  type: "text" | "image" | "file" | "audio";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: Message["replyTo"];
  reactions: Reaction[];
  status: "sent" | "delivered" | "read";
  edited: boolean;
  deleted: boolean;
  createdAt: string;
}

export type ChatTarget =
  | { kind: "user"; data: User }
  | { kind: "group"; data: Group };
