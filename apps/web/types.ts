export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  online?: boolean;
}

export interface ChatType {
  id: string;
  type: "personal" | "group";
  name: string;
  members: string[]; // User IDs
  createdAt: string;
  lastMessage?: MessageType;
  avatar?: string; // For groups
  admin?: string[]; // For groups - User IDs of admins
}

export interface MessageType {
  id: string;
  message: string;
  user: string; // Sender's ID
  chatId: string;
  timestamp: string;
  type: "text" | "image" | "file" | "system"; // System messages for group events
  status: "sent" | "delivered" | "read";
  readBy?: string[]; // Array of user IDs who have read the message
}
