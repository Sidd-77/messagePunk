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
      console.log('Waiting for user ID to be available...');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/chats/getChats`,
        { userId: currentUser.id }
      );
      setChats(response.data);
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
      socket.on('newChat', (chat: ChatType) => {
        setChats(prevChats => [...prevChats, chat]);
      });

      // Listen for chat updates
      socket.on('chatUpdated', (updatedChat: ChatType) => {
        setChats(prevChats =>
          prevChats.map(chat => 
            chat.id === updatedChat.id ? updatedChat : chat
          )
        );
      });

      return () => {
        socket.off('newChat');
        socket.off('chatUpdated');
      };
    }
  }, [socket, isConnected, currentUser.id]);

  // const chats:ChatType[] = [
  //   {
  //     id: "1",
  //     type: "personal",
  //     name: "John Doe",
  //     members: ["1", "2"],
  //     createdAt: "2021-08-01T12:00:00Z",
  //     lastMessage: {
  //       id: "1",
  //       message: "Hey there",
  //       user: "1",
  //       chatId: "1",
  //       timestamp: "2021-08-01T12:01:00Z",
  //       type: "text",
  //       status: "sent",
  //     },
  //   },
  //   {
  //     id: "2",
  //     type: "personal",
  //     name: "Jane Doe",
  //     members: ["1", "3"],
  //     createdAt: "2021-08-01T12:00:00Z",
  //     lastMessage: {
  //       id: "2",
  //       message: "Hello",
  //       user: "3",
  //       chatId: "2",
  //       timestamp: "2021-08-01T12:01:00Z",
  //       type: "text",
  //       status: "sent",
  //     },
  //   },
  //   {
  //     id: "3",
  //     type: "group",
  //     name: "Group Chat",
  //     members: ["1", "2", "3"],
  //     createdAt: "2021-08-01T12:00:00Z",
  //     lastMessage: {
  //       id: "3",
  //       message: "Welcome to the group",
  //       user: "1",
  //       chatId: "3",
  //       timestamp: "2021-08-01T12:01:00Z",
  //       type: "text",
  //       status: "sent",
  //     },
  //   },
  // ];

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
        <div className="flex items-center justify-between p-4">
          <UserButton />
          <SearchModal />
          <ModeToggle />
        </div>
        <Tabs
          defaultValue="chats"
          className="flex flex-col h-[calc(100%-64px)]"
        >
          <TabsList className="w-full">
            <TabsTrigger value="chats" className="w-full">
              Chats
            </TabsTrigger>
            <TabsTrigger value="groups" className="w-full">
              Groups
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="chats"
            className="flex-1 flex flex-col m-0 overflow-hidden"
          >
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search chats" className="pl-8" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-4 cursor-pointer hover:bg-accent"
                  onClick={() => {
                    setActiveChat(chat);
                    setIsSidebarOpen(false);
                  }}
                >
                  <div className="font-semibold">{chat.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {/* {chat?.lastMessage} */}
                  </div>
                  <Separator className="mt-2" />
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="groups" className="flex-1 m-0">
            <div className="p-4 text-center text-muted-foreground">
              Group chats will be displayed here
            </div>
          </TabsContent>
        </Tabs>
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
