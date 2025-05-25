'use client';

import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

export function PDFChatSection({
  pdfSummaryId
}: {
  pdfSummaryId: string;
  initialChats?: any[];
}) {
  const router = useRouter();

  const handleAskQuestions = () => {
    // Redirect to the chat page with a query parameter to show summary
    router.push(`/chat/new?pdfSummaryId=${pdfSummaryId}&showSummary=true`);
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
        >
          <MessageSquare className="h-4 w-4" />
          Ask Questions
        </Button>
      </div>
    </Card>
  );
}
