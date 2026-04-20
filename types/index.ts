export interface User {
  _id: string;
  name: string;
  email: string;
  image: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

export interface SocketMessage {
  messageId: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}
