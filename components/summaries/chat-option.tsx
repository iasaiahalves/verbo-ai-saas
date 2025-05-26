'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createChat } from "@/lib/chat";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ChatOptionProps {
  pdfSummaryId: string;
  className?: string;
}
export function ChatOption({ pdfSummaryId, className }: ChatOptionProps) {
  const [showInput, setShowInput] = useState(false);
  const [chatTitle, setChatTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatTitle.trim() || isCreating) return;
    
    setIsCreating(true);
    
    try {
      // Check if there are existing chats for this PDF first
      const response = await fetch(`/api/chats?pdfSummaryId=${pdfSummaryId}`);
      const existingChats = await response.json();
      
      if (existingChats && existingChats.length > 0) {
        // If a chat already exists with this title, use it
        const matchingChat = existingChats.find((chat: any) => 
          chat.title.toLowerCase() === chatTitle.toLowerCase()
        );
        
        if (matchingChat) {
          router.push(`/chat/${matchingChat.id}`);
          return;
        }
      }
      
      // Otherwise create a new chat
      const chat = await createChat(pdfSummaryId, chatTitle);
      router.push(`/chat/${chat.id}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat. Please try again.");
    } finally {
      setIsCreating(false);
      setChatTitle("");
      setShowInput(false);
    }
  };

  return (
    <div className={cn("absolute bottom-4 right-4 z-10", className)}>
      {showInput ? (
        <form onSubmit={handleCreateChat} className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-md">
          <Input
            value={chatTitle}
            onChange={(e) => setChatTitle(e.target.value)}
            placeholder="Chat title"
            className="w-40 text-sm"
            autoFocus
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!chatTitle.trim() || isCreating}
          >
            {isCreating ? "Creating..." : "Create"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowInput(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2"
          variant="secondary"
        >
          <MessageSquare className="h-4 w-4" />
          Ask Questions
        </Button>
      )}
    </div>
  );
}
