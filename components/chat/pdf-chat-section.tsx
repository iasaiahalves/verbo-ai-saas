'use client';

import { useNavigation } from '@/components/common/navigation-progress';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';

// Format date to a more readable format
function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  
  // Calculate time difference in milliseconds
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Convert to minutes, hours, days
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Return relative time for recent dates, or actual date for older ones
  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  } else {
    // For older dates, show the full date
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

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
  const navigatingRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  
  // Clean up effect to reset the ref when component unmounts
  useEffect(() => {
    return () => {
      navigatingRef.current = false;
    };
  }, []);

  // Use useCallback to ensure the function doesn't get recreated on every render
  const handleAskQuestions = useCallback(() => {
    // Debounce check - prevent rapid clicks
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      return;
    }
    lastClickTimeRef.current = now;
    
    // Prevent duplicate navigation
    if (isNavigating || navigatingRef.current) return;
    
    setIsNavigating(true);
    navigatingRef.current = true;
    startNavigation();
    
    // Wrap in setTimeout to further prevent duplicate executions
    setTimeout(async () => {
      // Check if there are existing chats for this PDF
      if (initialChats && initialChats.length > 0) {
        // Use the most recent chat instead of creating a new one
        const mostRecentChat = initialChats[0]; // Assuming they're sorted by updated_at DESC
        router.replace(`/chat/${mostRecentChat.id}?showSummary=true`);
      } else {
        // Only create a new chat if none exists
        router.replace(`/chat/new?pdfSummaryId=${pdfSummaryId}&showSummary=true`);
      }
    }, 50);
  }, [initialChats, isNavigating, pdfSummaryId, router, startNavigation]);  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Chat with Verbo</h2>
        </div>
      </div>      <div className="text-center py-4">
        <p className="text-muted-foreground mb-6">
          {initialChats && initialChats.length > 0 
            ? "Continue your conversation about this document. Ask follow-up questions and get AI-powered insights."
            : "Have questions about this document? Start a chat to ask specific questions and get AI-powered insights."
          }
        </p>        {initialChats && initialChats.length > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Last conversation: {formatDate(initialChats[0].updated_at)}
          </p>
        )}        <Button 
          onClick={handleAskQuestions}
          className="flex items-center gap-2 w-full sm:w-auto justify-center mx-auto"
          disabled={isNavigating}
          size="lg"
          variant={initialChats && initialChats.length > 0 ? "secondary" : "default"}
          title={initialChats && initialChats.length > 0 
            ? "Continue your previous conversation about this document" 
            : "Start a new conversation about this document"}
        >{isNavigating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              <span>{initialChats && initialChats.length > 0 ? "Continue asking questions" : "Ask Questions"}</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
