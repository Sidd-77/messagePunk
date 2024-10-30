import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FileUpload = ({
  chatId,
  userId,
  publishMessage,
}: {
  chatId: any;
  userId: any;
  publishMessage: any;
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error state
    setError(null);

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        // @ts-ignore
        const base64Data = reader?.result?.split(",")[1];

        // Create message object
        const message = {
          id: crypto.randomUUID(), // Generate message ID
          type: "file",
          chat_id: chatId,
          user_id: userId,
          status: "pending",
          timestamp: new Date().toISOString(),
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data,
          },
        };

        // Publish message to queue
        await publishMessage("message.file", message);

        // Reset file input
        event.target.value = "";
      };

      reader.onerror = () => {
        setError("Failed to read file");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to upload file. Please try again.");
    }
  };

  return (
    <div className="">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="relative overflow-hidden"
        >
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileUpload}
          />
          <Upload className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;
