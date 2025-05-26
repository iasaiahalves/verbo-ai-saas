'use client';

import { useNavigation } from '@/components/common/navigation-progress';
import { createChat } from '@/lib/chat';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavigation } = useNavigation();
  const pdfSummaryId = searchParams.get('pdfSummaryId');
  const showSummary = searchParams.get('showSummary') === 'true';
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfSummaryId) {
      setError('No PDF summary ID provided');
      setIsCreating(false);
      return;
    }

    async function createNewChat() {
      try {
        // First check if the user already has chats for this PDF
        const existingChats = await fetch(`/api/chats?pdfSummaryId=${pdfSummaryId}`).then(res => res.json());
        
        if (existingChats && existingChats.length > 0) {
          // Use the most recent chat instead of creating a new one
          startNavigation();
          router.replace(`/chat/${existingChats[0].id}${showSummary ? '?showSummary=true' : ''}`);
          return;
        }
        
        // Only create a new chat if none exists
        const title = `Chat about PDF - ${new Date().toLocaleString()}`;
        const chat = await createChat(pdfSummaryId as string, title);
        
        startNavigation();
        router.replace(`/chat/${chat.id}${showSummary ? '?showSummary=true' : ''}`);
      } catch (error) {
        console.error('Failed to create chat:', error);
        setError('Failed to create a new chat. Please try again.');
        setIsCreating(false);
      }
    }

    createNewChat();
  }, [pdfSummaryId, router, showSummary, startNavigation]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {isCreating ? (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500 mb-4"></div>
          <p>Creating your chat...</p>
        </div>
      ) : (
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => router.back()} 
            className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}
