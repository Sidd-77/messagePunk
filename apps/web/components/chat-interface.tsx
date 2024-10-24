import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PaperclipIcon, Smile, Send } from "lucide-react"

interface Chat {
  id: string
  name: string
  lastMessage: string
}

interface ChatInterfaceProps {
  chatId: string
  chats: Chat[]
}

export default function ChatInterface({ chatId, chats }: ChatInterfaceProps) {
  const [message, setMessage] = useState("")
  const activeChat = chats.find((chat) => chat.id === chatId)

  const handleSendMessage = () => {
    if (message.trim()) {
      // Here you would typically send the message to your backend
      console.log("Sending message:", message)
      setMessage("")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between bg-background">
        <div className="font-semibold">{activeChat?.name}</div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <PaperclipIcon className="h-5 w-5" />
          </Button>
          {/* <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5" />
          </Button> */}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="bg-accent p-2 rounded-lg max-w-[70%] ml-auto">
            Hello! How are you?
          </div>
          <div className="bg-muted p-2 rounded-lg max-w-[70%]">
            Hi! I'm doing great, thanks for asking. How about you?
          </div>
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t flex items-center space-x-2 bg-background">
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Smile className="h-5 w-5" />
        </Button>
        <Input
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1"
        />
        <Button variant="ghost" size="icon">
            <PaperclipIcon className="h-5 w-5" />
          </Button>
        <Button variant="ghost" size="icon" onClick={handleSendMessage}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}