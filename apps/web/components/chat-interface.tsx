import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { MessageType, ChatType, UserType } from '@/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import axios from 'axios';

interface ChatInterfaceProps {
  chat: ChatType;
  currentUser: UserType;
}

const ChatInterface = ({ chat, currentUser }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { socket, sendMessage, markMessagesAsRead } = useSocket();

  const fetchMessages = async() =>{
    const response = await axios.post(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/messages/getMessages`, { chatId: chat.id} );
    console.log(response.data);
    setMessages(response.data);
  }

  useEffect(() => {
    fetchMessages();
  }, [chat.id]);

  useEffect(() => {
    if (socket && chat) {
      // Join chat room
      socket.emit('join_chat', { chatId: chat.id, userId: currentUser.id });

      // Listen for new messages
      socket.on('receive_message', (message: MessageType) => {
        setMessages(prev => [...prev, message]);
        // Mark message as read if chat is active
        markMessagesAsRead(chat.id, currentUser.id, [message.id]);
      });

      // Handle typing indicators
      socket.on('user_typing', ({ chatId, user }) => {
        if (chatId === chat.id && user.id !== currentUser.id) {
          setTypingUsers(prev => new Set(prev).add(user.id));
          // Clear typing indicator after delay
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(user.id);
              return newSet;
            });
          }, 3000);
        }
      });

      // Group chat specific listeners
      if (chat.type === 'group') {
        socket.on('user_joined_chat', ({ userId }) => {
          // Update UI to show new user joined
        });

        socket.on('user_left_group', ({ userId }) => {
          // Update UI to show user left
        });
      }

      return () => {
        socket.emit('leave_chat', { chatId: chat.id, userId: currentUser.id });
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_joined_chat');
        socket.off('user_left_group');
      };
    }
  }, [socket, chat.id]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        id: `msg_${Date.now()}`,
        message: newMessage,
        user: currentUser.id,
        chatId: chat.id,
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sent',
        readBy: []
      };
      
      sendMessage(messageData);
      setNewMessage('');
      setMessages(prev => [...prev, messageData]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          {chat.type === 'group' ? (
            <div className="flex items-center">
              {/* Group avatar and name */}
              <div className="font-semibold">{chat.name}</div>
              <div className="text-sm text-muted-foreground">
                {chat.members.length} members
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              {/* Individual chat header */}
              <div className="font-semibold">{chat.name}</div>
            </div>
          )}
        </div>
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
            {Array.from(typingUsers).map(userId => {
              const user = chat.members.find(m => m === userId);
              return user;
            }).join(', ')} is typing...
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              socket?.emit('typing', { 
                chatId: chat.id, 
                user: currentUser 
              });
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
  message: MessageType, 
  isOwn: boolean,
  chat: ChatType
}) => {
  return (
    <div className={`mb-4 ${isOwn ? 'text-right' : 'text-left'}`}>
      <div className={`inline-block max-w-[70%] p-2 rounded-lg ${
        isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
      }`}>
        {/* Show sender name in group chats */}
        {chat.type === 'group' && !isOwn && (
          <div className="text-xs font-semibold mb-1">
            {/* {message.user} */}
            "some sender"
          </div>
        )}
        <div>{message.message}</div>
        <div className="text-xs mt-1 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
          {/* Message status indicators */}
          {isOwn && (
            <span className="ml-2">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

