'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createChat } from '@/lib/chat';
import { MessageSquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewChatButton({
  pdfSummaryId,
  onChatCreated
}: {
  pdfSummaryId: string;
  onChatCreated?: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const router = useRouter();

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || isCreating) return;
    
    setIsCreating(true);
    
    try {
      const chat = await createChat(pdfSummaryId, title);
      
      // Navigate to the new chat
      router.push(`/chat/${chat.id}`);
      router.refresh();

      // Call the callback after successful creation
      if (onChatCreated) {
        onChatCreated();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create a new chat. Please try again.');
    } finally {
      setIsCreating(false);
      setTitle('');
    }
  };

  return (
    <div>
      {isCreating ? (
        <form onSubmit={handleCreateChat} className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your chat"
            className="w-full"
            autoFocus
          />
          <Button type="submit" disabled={!title.trim()}>
            Create
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsCreating(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button 
          onClick={() => setIsCreating(true)} 
          className="w-full"
          variant="outline"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      )}
    </div>
  );
}
