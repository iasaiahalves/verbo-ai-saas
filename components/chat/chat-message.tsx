'use client';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
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
      "flex items-start gap-3 py-2 px-1 mb-1 animate-in fade-in-0 slide-in-from-bottom-3 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <Avatar className="border-2 border-rose-100 dark:border-rose-900/30 shadow-sm">
            <Bot className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </Avatar>
        </div>
      )}
      
      <Card className={cn(
        "p-4 max-w-[85%] shadow-sm border-0",
        isUser 
          ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-2xl rounded-tr-sm" 
          : "bg-white dark:bg-gray-800/90 dark:text-gray-100 shadow-md rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700/30"
      )}>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse delay-150"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse delay-300"></div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:text-xs prose-pre:rounded-md">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </Card>
      
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <Avatar className="border-2 border-rose-100 dark:border-rose-900/30 shadow-sm">
            <User className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </Avatar>
        </div>
      )}
    </div>
  );
}
