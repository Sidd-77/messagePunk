"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import ChatInterface from "@/components/chat-interface";
import { Search, UserCircle, Menu, X, User } from "lucide-react";
import { UserInfo } from "@/components/user-info-modal";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const chats = [
    { id: "1", name: "Alice", lastMessage: "Hey, how are you?" },
    { id: "2", name: "Bob", lastMessage: "Did you see the game last night?" },
    { id: "3", name: "Group: Family", lastMessage: "Mom: Dinner at 7!" },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <main className="flex h-screen overflow-hidden">
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
                    setActiveChat(chat.id);
                    setIsSidebarOpen(false);
                  }}
                >
                  <div className="font-semibold">{chat.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {chat.lastMessage}
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
          <ChatInterface chatId={activeChat} chats={chats} />
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
