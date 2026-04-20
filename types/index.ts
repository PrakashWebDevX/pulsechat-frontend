export interface User {
  _id: string;
  name: string;
  email: string;
  image: string;
  createdAt: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  type: "text" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: {
    _id: string;
    message: string;
    senderId: string;
    type: "text" | "image" | "file";
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
  receiverId: string;
  message: string;
  type: "text" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: Message["replyTo"];
  reactions: Reaction[];
  status: "sent" | "delivered" | "read";
  edited: boolean;
  deleted: boolean;
  createdAt: string;
}
