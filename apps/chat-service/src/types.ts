// types.ts
export interface UserType {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface MessageType {
  id: string;
  message: string;
  user: string; // String when creating/querying, User when populated
  chatId: string;
  timestamp: string;
  type: "text" | "image" | "file" | "system";
  status: "sent" | "delivered" | "read";
  readBy: string[] | UserType[]; // String[] when creating/querying, User[] when populated
}

export interface ChatType {
  id: string;
  type: "personal" | "group";
  name: string;
  members: string[] | UserType[]; // String[] when creating/querying, User[] when populated
  createdAt: string;
  lastMessage?: string | MessageType; // String when creating/querying, Message when populated
  avatar?: string;
  admin?: string[] | UserType[]; // String[] when creating/querying, User[] when populated
}

// Optional: You might want to add presence types as well
export interface UserPresenceDB {
  userId: string; // User ID
  status: "online" | "offline";
  lastSeen: string;
}

export interface UserPresence {
  userId: UserType; // Populated User
  status: "online" | "offline";
  lastSeen: string;
}
