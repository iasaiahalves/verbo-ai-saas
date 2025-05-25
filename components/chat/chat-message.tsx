'use client';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: Date;
};

export function ChatMessage({
  message,
  isLoading = false
}: {
  message: Message;
  isLoading?: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex items-start gap-3",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="flex-shrink-0">
          <Avatar>
            <Bot className="h-6 w-6" />
          </Avatar>
        </div>
      )}
      
      <Card className={cn(
        "p-4 max-w-[80%]",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isLoading ? (
          <Skeleton className="w-24 h-4" />
        ) : (
          <div className="prose prose-sm dark:prose-invert">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </Card>
      
      {isUser && (
        <div className="flex-shrink-0">
          <Avatar>
            <User className="h-6 w-6" />
          </Avatar>
        </div>
      )}
    </div>
  );
}
