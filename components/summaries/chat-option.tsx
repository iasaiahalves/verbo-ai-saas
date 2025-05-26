'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createChat } from "@/lib/chat";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatOptionProps {
  pdfSummaryId: string;
  className?: string;
}
export function ChatOption({ pdfSummaryId, className }: ChatOptionProps) {
  const [showInput, setShowInput] = useState(false);
  const [chatTitle, setChatTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const formSubmittedRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const pendingNavigationRef = useRef(false);
  const router = useRouter();
  
  // Cleanup effect to reset the refs when component unmounts
  useEffect(() => {
    return () => {
      formSubmittedRef.current = false;
      pendingNavigationRef.current = false;
    };
  }, []);

  // Debounced click handler with useCallback to prevent recreation on render
  const handleAskQuestionClick = useCallback(() => {
    const now = Date.now();
    // Prevent clicks that are too close together (300ms debounce)
    if (now - lastClickTimeRef.current < 300 || showInput || pendingNavigationRef.current) {
      return;
    }
    lastClickTimeRef.current = now;
    setShowInput(true);
  }, [showInput]);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatTitle.trim() || isCreating || formSubmittedRef.current) return;
    
    // Set ref to prevent duplicate submissions
    formSubmittedRef.current = true;
    pendingNavigationRef.current = true;
    setIsCreating(true);
    
    try {
      // Generate a unique identifier for this chat creation attempt
      const uniqueId = `${pdfSummaryId}-${Date.now()}`;
      console.log(`Starting chat creation: ${uniqueId}`);
      
      // Check if there are existing chats for this PDF first
      const response = await fetch(`/api/chats?pdfSummaryId=${pdfSummaryId}`);
      const existingChats = await response.json();
      
      if (existingChats && existingChats.length > 0) {
        // If a chat already exists with this title, use it
        const matchingChat = existingChats.find((chat: any) => 
          chat.title.toLowerCase() === chatTitle.toLowerCase()
        );
        
        if (matchingChat) {
          console.log(`Using existing chat: ${matchingChat.id}`);
          // Use replace to avoid adding to browser history stack
          router.replace(`/chat/${matchingChat.id}`);
          return;
        }
      }
      
      // Otherwise create a new chat
      console.log(`Creating new chat for PDF: ${pdfSummaryId}`);
      const chat = await createChat(pdfSummaryId, chatTitle);
      console.log(`Chat created with ID: ${chat.id}`);
      
      // Add a small delay before navigation to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use router.replace instead of push to avoid creating duplicate entries in history
      router.replace(`/chat/${chat.id}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat. Please try again.");
      // Reset the refs if there's an error so the user can try again
      formSubmittedRef.current = false;
      pendingNavigationRef.current = false;
    } finally {
      setIsCreating(false);
      setChatTitle("");
      setShowInput(false);
    }
  };
  return (
    <div className={cn("absolute bottom-4 right-4 z-10", className)}>
      {showInput ? (
        <form 
          onSubmit={handleCreateChat} 
          className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-md"
        >
          <Input
            value={chatTitle}
            onChange={(e) => setChatTitle(e.target.value)}
            placeholder="Chat title"
            className="w-40 text-sm"
            autoFocus
            disabled={isCreating}
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
            Cancel          </Button>        </form>
      ) : (
        <Button
          onClick={handleAskQuestionClick}
          className="flex items-center gap-2"
          variant="secondary"
          disabled={isCreating || pendingNavigationRef.current}
        >
          <MessageSquare className="h-4 w-4" />
          Ask Questions
        </Button>
      )}
    </div>
  );
}
