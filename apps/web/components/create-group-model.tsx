import React, { useState } from "react";
import axios from "axios";
import { Search, X, Loader2, Users, Plus, Check } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { UserType } from "@/types";
import { useUser } from "@clerk/nextjs";
import { generateString } from "@/lib/utils";

const CreateGroupModal = () => {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/users/searchUsers`,
        { query: searchQuery },
      );
      // Filter out already selected users from search results
      const filteredResults = response.data.filter(
        (user: UserType) =>
          !selectedUsers.some((selected) => selected.id === user.id),
      );
      setSearchResults(filteredResults);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch search results.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: UserType) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter((u) => u.id !== user.id));
  };

  const handleRemoveUser = (user: UserType) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name.",
        variant: "destructive",
      });
      return;
    }

    if (selectedUsers.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 users for the group.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingGroup(true);
      const groupObj = {
        id: "chat_" + generateString(15),
        name: groupName,
        type: "group",
        members: [user?.id, ...selectedUsers.map((u) => u.id)],
        createdAt: new Date().toISOString(),
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/chats/createChat`,
        groupObj,
      );

      toast({
        title: "Success",
        description: "Group created successfully!",
      });

      setOpen(false);
      setGroupName("");
      setSelectedUsers([]);
      setSearchResults([]);
      setSearchQuery("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name Input */}
          <div>
            <Input
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mb-4"
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Selected Users:
              </p>
              <ScrollArea className="max-h-[100px]">
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {user.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveUser(user)}
                      />
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Search Users */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search users to add..."
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

          {/* Search Results */}
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {searchResults.map((user) => (
                <Card key={user.id} className="cursor-pointer hover:bg-accent">
                  <CardHeader className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-sm">{user.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {user.email}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSelectUser(user)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {searchResults.length === 0 && searchQuery && !isLoading && (
                <div className="text-center py-4 text-muted-foreground">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Create Group Button */}
          <Button
            className="w-full"
            onClick={handleCreateGroup}
            disabled={isCreatingGroup || !groupName || selectedUsers.length < 2}
          >
            {isCreatingGroup ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
