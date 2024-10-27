
export interface MessageType {
    id: string;
    message: string;
    user: string;
    chatId: string;
    timestamp: string;
    type: 'text' | 'image' | 'file' | 'system';
    status: 'sent' | 'delivered' | 'read';
}

export interface UserPresence {
    userId: string;
    status: 'online' | 'offline';
    lastSeen: string;
}

export interface ChatType {
    id: string;
    type: 'personal' | 'group';
    name: string;
    members: string[];
    createdAt: string;
    lastMessage?: MessageType;
}