'use client';

import { useNavigation } from '@/components/common/navigation-progress';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../ui/button';

export function PDFChatSection({
  pdfSummaryId,
  initialChats = []
}: {
  pdfSummaryId: string;
  initialChats?: any[];
}) {
  const router = useRouter();
  const { startNavigation } = useNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAskQuestions = () => {
    setIsNavigating(true);
    startNavigation();
    
    // Check if there are existing chats for this PDF
    if (initialChats && initialChats.length > 0) {
      // Use the most recent chat instead of creating a new one
      const mostRecentChat = initialChats[0]; // Assuming they're sorted by updated_at DESC
      router.push(`/chat/${mostRecentChat.id}?showSummary=true`);
    } else {
      // Only create a new chat if none exists
      router.push(`/chat/new?pdfSummaryId=${pdfSummaryId}&showSummary=true`);
    }
  };
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Chat with Verbo</h2>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-muted-foreground mb-6">
          Have questions about this document? Start a chat to ask specific questions and get AI-powered insights.
        </p>
          <Button 
          onClick={handleAskQuestions}
          className="flex items-center gap-2 w-full sm:w-auto justify-center"
          disabled={isNavigating}
        >
          {isNavigating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              <span>Ask Questions</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
