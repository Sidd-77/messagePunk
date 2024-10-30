import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { MessageType, ChatType, UserType } from '@/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import EditGroupModal from './edit-group-modal';
import axios from 'axios';
import FileUpload from './file-upload';
interface ChatInterfaceProps {
  chat: any;
  currentUser: UserType;
}

interface TypingEvent {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

const ChatInterface = ({ chat, currentUser }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { socket, sendMessage, markMessagesAsRead } = useSocket();
  useEffect(() => {
    fetchMessages();
  }, [chat.id]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/messages/getMessages`, { chatId: chat.id });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [chat.id]);

  const handleTyping = useCallback((status: boolean) => {
    console.log('Typing:', currentUser);
    socket?.emit("typing", {
      chatId: chat.id,
      userId: currentUser.id,
      userName: currentUser.name,
      isTyping: status,
    });
  }, [socket, chat.id, currentUser.id, currentUser.name, newMessage]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (socket && chat) {
      // Join chat room
      socket.emit('join_chat', { chatId: chat.id, userId: currentUser.id });

      // Listen for new messages
      const handleReceiveMessage = (message: any) => {
        if(message.user_id === currentUser.id || message.user === currentUser.id) { return; }
        console.log('Received message:', message);
        setMessages(prev => [...prev, message]);
        // Mark message as read if chat is active
        markMessagesAsRead(chat.id, currentUser.id, [message.id]);
      };

      // Handle typing indicators
      const handleTyping = (event: TypingEvent) => {
        console.log('Typing event:', event);
        if (event.chatId === chat.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (event.isTyping) {
              newSet.add(event.userName);
            } else {
              newSet.delete(event.userName);
            }
            return newSet;
          });
        }
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('typing', handleTyping);

      // Group chat specific listeners
      if (chat.type === 'group') {
        const handleUserJoined = ({ userId }: { userId: string }) => {
          // Update UI to show new user joined
          console.log(`User ${userId} joined the chat`);
        };

        const handleUserLeft = ({ userId }: { userId: string }) => {
          // Update UI to show user left
          console.log(`User ${userId} left the chat`);
        };

        socket.on('user_joined_chat', handleUserJoined);
        socket.on('user_left_group', handleUserLeft);

        return () => {
          socket.emit('leave_chat', { chatId: chat.id, userId: currentUser.id });
          socket.off('receive_message', handleReceiveMessage);
          socket.off('typing', handleTyping);
          socket.off('user_joined_chat', handleUserJoined);
          socket.off('user_left_group', handleUserLeft);
        };
      }

      return () => {
        socket.emit('leave_chat', { chatId: chat.id, userId: currentUser.id });
        socket.off('receive_message', handleReceiveMessage);
        socket.off('typing', handleTyping);
      };
    }
  }, [socket, chat, currentUser.id, markMessagesAsRead]);

  const publishMessage = async (event: string, message: MessageType) => {
    if (socket) {
      socket.emit(event, message);
    }
  }

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim()) {
      const messageData: any = {
        id: `msg_${Date.now()}`,
        message: newMessage,
        user: currentUser.id,
        chatId: chat.id,
        userName: currentUser.name,
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sent',
        readBy: []
      };

      handleTyping(false);
      sendMessage(messageData);
      setNewMessage('');
      setMessages(prev => [...prev, messageData]);
    }
  }, [newMessage, currentUser.id, chat.id, sendMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b flex justify-between">
        <div className="flex items-center gap-3">
          {chat.type === 'group' ? (
            <div className="flex items-center">
              {/* Group avatar and name */}
              <div className="font-semibold pr-2">{chat.name}</div>
              <div className="text-sm text-muted-foreground">
                {chat.members.length} members
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              {/* Individual chat header */}
              <div className="font-semibold">{chat.other_members[0].name}</div>
            </div>
          )}
        </div>
        {chat.type === 'group' && (<div className=' '>
          <EditGroupModal groupId={chat.id} groupName={chat.name} currentMembers={chat.other_members} />
        </div>)}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.user_id === currentUser.id  || msg.user === currentUser.id}
            chat={chat}
          />
        ))}
        
        {typingUsers.size > 0 && (
          <div className="text-sm text-muted-foreground italic">
            {Array.from(typingUsers).map(user => {
              return user;
            }).join(', ')} is typing...
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
        <FileUpload chatId={chat.id} userId={currentUser.id} publishMessage={publishMessage} />
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping(true);
            }}
          
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type a message..."
          />
          
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isOwn, chat }: { 
  message: any, 
  isOwn: boolean,
  chat: any
}) => {
  return (
    <div className={`mb-4 ${isOwn ? 'text-right' : 'text-left'}`}>
      <div className={`inline-block max-w-[70%] p-2 rounded-lg ${
        isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
      }`}>
        {/* Show sender name in group chats */}
        {chat.type === 'group' && !isOwn && (
          <div className="text-xs font-semibold mb-1">
            {message.user.name || message.userName}
          </div>
        )}
        <div>{message.message}</div>
        <div className="text-xs mt-1 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
          {/* Message status indicators */}
          {/* {isOwn && (
            <span className="ml-2">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

