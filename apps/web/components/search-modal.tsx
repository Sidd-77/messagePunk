import React, { useState } from 'react';
import axios from 'axios';
import { Search, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { UserType, ChatType } from '@/types';
import { useUser } from '@clerk/nextjs';
import { generateString } from '@/lib/utils';

const SearchModal = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const {user} = useUser();
  const handleSearch = async (e:any) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const serachObj = { query: searchQuery } as any;
    try {
      setIsLoading(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/users/searchUsers`, serachObj );
      console.log(response.data);
      setSearchResults(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch search results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChat = async (userId : string) => {
    try {
      setIsCreatingChat(true);
      const chatObj = {
        id: "chat_"+generateString(15),
        name: `replace_me`,
        type: "personal",
        members: [user?.id, userId],
        createdAt: new Date().toISOString(),
      };
      console.log(chatObj);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/chats/createChat`, chatObj);

      toast({
        title: "Success",
        description: "Chat created successfully!",
      });

      // Close the modal
      setOpen(false);

      // You might want to redirect to the chat or update the UI
      // window.location.href = `/chats/${response.data.chatId}`;

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-[300px]">
          <Search className="h-4 w-4 mr-2" />
          Search Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearch} className="flex gap-2 mt-4">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
          {searchResults?.map((user) => (
            <Card key={user.id}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <Button
                    onClick={() => handleCreateChat(user.id)}
                    disabled={isCreatingChat}
                  >
                    {isCreatingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
          
          {searchResults?.length === 0 && searchQuery && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;