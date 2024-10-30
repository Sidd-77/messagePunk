"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import ChatInterface from "@/components/chat-interface";
import { Search, UserCircle, Menu, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useSocket } from "@/context/SocketProvider";
import { ChatType, UserType } from "@/types";
import { useUser } from "@clerk/nextjs";
import SearchModal from "@/components/search-modal";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateGroupModal from "@/components/create-group-model";
import NotificationSubscribe from "@/components/notificationSubscribe";
import axios from "axios";

export default function Home() {
  const [activeChat, setActiveChat] = useState<ChatType | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useUser();

  const currentUser: UserType = {
    id: user?.id || "",
    name: user?.fullName || "",
    avatar: "",
    email: user?.primaryEmailAddress?.emailAddress || "",
  };

  const fetchChats = async () => {
    // Don't proceed if there's no user ID
    if (!currentUser.id) {
      console.log("Waiting for user ID to be available...");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/chats/getChats`,
        { userId: currentUser.id }
      );
      setChats(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Failed to fetch chats", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch chats when we have a valid user ID and socket connection
    if (currentUser.id && socket && isConnected) {
      fetchChats();
    }
  }, [currentUser.id, socket, isConnected]);

  // Add socket event listeners when connection is established
  useEffect(() => {
    if (socket && isConnected && currentUser.id) {
      // Listen for new chat events
      socket.on("newChat", (chat: ChatType) => {
        setChats((prevChats) => [...prevChats, chat]);
      });

      // Listen for chat updates
      socket.on("chatUpdated", (updatedChat: ChatType) => {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === updatedChat.id ? updatedChat : chat
          )
        );
      });

      return () => {
        socket.off("newChat");
        socket.off("chatUpdated");
      };
    }
  }, [socket, isConnected, currentUser.id]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <main className="flex h-screen overflow-hidden">
      <Toaster />
      {/* Burger Menu for Mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Sidebar */}
      <div
      className={`${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } transform transition-transform duration-300 ease-in-out md:translate-x-0 fixed md:relative top-0 left-0 w-full md:w-80 h-full bg-background border-r z-40`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <UserButton />
        <NotificationSubscribe userId={user?.id || "too early"} />
        <ModeToggle />
      </div>

      {/* Search */}
      <div className="p-2 border-b flex flex-col space-y-2">
  <div className="w-full">
    <SearchModal />
  </div>
  <div className="w-full">
    <CreateGroupModal />
  </div>
</div>


      {/* Tabs */}
      
          <ScrollArea className="flex-1 px-2">
            {chats.map((chat) => {
              // @ts-ignore
              const otherMember = chat.type === "personal" ? chat.other_members[0] : null;
              // @ts-ignore
              const lastMessageTime = chat.last_message?.timestamp ? format(new Date(chat.last_message.timestamp), 'HH:mm') : '';
              
              return (
                <div
                  key={chat.id}
                  className="group flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-accent transition-colors"
                  onClick={() => {
                    setActiveChat(chat);
                    setIsSidebarOpen(false);
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={chat.type === "personal" ? otherMember?.avatar : chat.avatar}
                      alt={chat.type === "personal" ? otherMember?.name : chat.name}
                    />
                    <AvatarFallback className="text-base">
                      {chat.type === "personal"
                        ? otherMember?.name?.charAt(0).toUpperCase()
                        : chat.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium truncate">
                        {chat.type === "personal" ? otherMember?.name : chat.name}
                      </span>
                      {lastMessageTime && (
                        <span className="text-xs text-muted-foreground">
                          {lastMessageTime}
                        </span>
                      )}
                    </div>
{                    // @ts-ignore
}                    {chat.last_message && (<p className="text-sm text-muted-foreground truncate">{chat.last_message.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        
    </div>

      {/* Main Chat Area */}
      <div className="flex-1 md:ml-0">
        {activeChat ? (
          <ChatInterface chat={activeChat} currentUser={currentUser} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingSpinner() {
  return <div>Loading...</div>;
}

function AccessDenied() {
  return <div>Access Denied</div>;
}
