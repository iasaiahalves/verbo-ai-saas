'use client';

import { useNavigation } from '@/components/common/navigation-progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createChat } from '@/lib/chat';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export function NewChatButton({
  pdfSummaryId,
  onChatCreated
}: {
  pdfSummaryId: string;
  onChatCreated?: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [title, setTitle] = useState('');
  const router = useRouter();
  const { startNavigation } = useNavigation();
  const formSubmittedRef = useRef(false);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || isCreating || formSubmittedRef.current) return;
    
    formSubmittedRef.current = true;
    setIsCreating(true);
    
    try {
      const chat = await createChat(pdfSummaryId, title);
      
      // Start navigation indicator and set navigating state
      startNavigation();
      setIsNavigating(true);
        // Navigate to the new chat
      router.replace(`/chat/${chat.id}`);

      // Call the callback after successful creation
      if (onChatCreated) {
        onChatCreated();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create a new chat. Please try again.');
      formSubmittedRef.current = false;
      setIsCreating(false);
      setIsNavigating(false);
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
          />          <Button type="submit" disabled={!title.trim() || isNavigating}>
            {isNavigating ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              'Create'
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsCreating(false)}
            disabled={isNavigating}
          >
            Cancel
          </Button>
        </form>
      ) : (        <Button 
          onClick={() => {
            if (!isCreating) {
              setIsCreating(true);
            }
          }} 
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
