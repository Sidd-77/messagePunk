export interface UserType {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MessageType {
  id: string;
  message: string;
  user: string;
  chatId: string;
  timestamp: string;
  type: "text" | "image" | "file" | "system";
  status: "sent" | "delivered" | "read";
}

export interface UserPresence {
  userId: string;
  status: "online" | "offline";
  lastSeen: string;
}

export interface ChatType {
  id: string;
  type: "personal" | "group";
  name: string;
  members: string[]; // User IDs
  createdAt: string;
  lastMessage?: MessageType;
  avatar?: string; // For groups
  admin?: string; // For groups - User IDs of admins
}
