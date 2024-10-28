"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { MessageType, ChatType, UserType } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  joinChat: (chatId: string, userId: string) => void;
  leaveChat: (chatId: string, userId: string) => void;
  sendTypingIndicator: (chatId: string, user: UserType) => void;
  markMessagesAsRead: (chatId: string, userId: string, messageIds: string[]) => void;
  addUsersToGroup: (chatId: string, userIds: string[]) => void;
  leaveGroup: (chatId: string, userId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    sendMessage: () => {},
    joinChat: () => {},
    leaveChat: () => {},
    sendTypingIndicator: () => {},
    markMessagesAsRead: () => {},
    addUsersToGroup: () => {},
    leaveGroup: () => {}
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_MESSAGE_SERVICE_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = (message: MessageType) => {
    if (socket) {
      socket.emit('message', message);
    }
  };

  const joinChat = (chatId: string, userId: string) => {
    if (socket) {
      socket.emit('join_chat', chatId, userId);
    }
  };

    const leaveChat = (chatId: string, userId: string) => {
        if (socket) {
        socket.emit('leave_chat', chatId, userId);
        }
    };

    const sendTypingIndicator = (chatId: string, user: UserType) => {
        if (socket) {
        socket.emit('typing', { chatId, user });
        }
    };

    const markMessagesAsRead = (chatId: string, userId: string, messageIds: string[]) => {
        if (socket) {
        socket.emit('mark_read', { chatId, userId, messageIds });
        }
    };

    const addUsersToGroup = (chatId: string, userIds: string[]) => {
        if (socket) {
        socket.emit('add_users', { chatId, userIds });
        }
    };

    const leaveGroup = (chatId: string, userId: string) => {
        if (socket) {
        socket.emit('leave_group', { chatId, userId });
        }
    };



  // ... implement other methods ...

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      sendMessage,
      joinChat,
      leaveChat,
      sendTypingIndicator,
      markMessagesAsRead,
      addUsersToGroup,
      leaveGroup
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);