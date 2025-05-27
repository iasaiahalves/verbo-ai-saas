'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Bot, Check, Copy, User } from 'lucide-react';
import { useState } from 'react';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className={cn(
      "group flex items-start gap-4 px-2 py-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={cn(
          "relative w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105",
          isUser 
            ? "bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-200 dark:shadow-rose-900/30" 
            : "bg-gradient-to-br from-slate-100 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 shadow-gray-200 dark:shadow-gray-800"
        )}>
          {isUser ? (
            <User className="h-5 w-5 text-white" />
          ) : (
            <Bot className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          )}
          
          {/* Online indicator for bot */}
          {!isUser && !isLoading && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          )}
        </div>
      </div>

      {/* Message bubble */}
      <div className={cn(
        "flex-1 max-w-[75%] relative",
        isUser ? "text-right" : "text-left"
      )}>
        <Card className={cn(
          "relative p-4 shadow-lg border-0 transition-all duration-200 group-hover:shadow-xl",
          isUser 
            ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl rounded-tr-lg ml-auto" 
            : "bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl rounded-tl-lg border border-gray-100 dark:border-gray-700/50 shadow-gray-200/50 dark:shadow-gray-900/50"
        )}>
          
          {/* Copy button for assistant messages */}
          {!isUser && !isLoading && (
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}

          {/* Loading animation */}
          {isLoading ? (
            <div className="flex items-center space-x-2 py-2">
              <div className="flex space-x-1">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse delay-75"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse delay-150"></div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                Thinking...
              </span>
            </div>
          ) : (
            /* Message content */
            <div className={cn(
              "prose prose-sm max-w-none leading-relaxed",
              isUser 
                ? "prose-invert text-white [&>*]:text-white" 
                : "dark:prose-invert prose-gray [&>p]:text-gray-800 dark:[&>p]:text-gray-200 [&>h1]:text-gray-900 dark:[&>h1]:text-gray-100 [&>h2]:text-gray-900 dark:[&>h2]:text-gray-100 [&>h3]:text-gray-900 dark:[&>h3]:text-gray-100",
              // Code styling
              "[&>pre]:bg-gray-100 dark:[&>pre]:bg-gray-800/80 [&>pre]:border [&>pre]:border-gray-200 dark:[&>pre]:border-gray-700 [&>pre]:rounded-xl [&>pre]:p-4 [&>pre]:text-sm [&>pre]:overflow-x-auto",
              "[&>p>code]:bg-gray-100 dark:[&>p>code]:bg-gray-800 [&>p>code]:px-2 [&>p>code]:py-1 [&>p>code]:rounded-md [&>p>code]:text-sm [&>p>code]:border [&>p>code]:border-gray-200 dark:[&>p>code]:border-gray-700",
              // List styling
              "[&>ul]:space-y-1 [&>ol]:space-y-1 [&>ul>li]:text-gray-800 dark:[&>ul>li]:text-gray-200 [&>ol>li]:text-gray-800 dark:[&>ol>li]:text-gray-200",
              // Link styling
              "[&>p>a]:text-rose-600 dark:[&>p>a]:text-rose-400 [&>p>a]:underline [&>p>a]:decoration-rose-300 dark:[&>p>a]:decoration-rose-600 hover:[&>p>a]:decoration-rose-500"
            )}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="space-y-1 mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="space-y-1 mb-3">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-0">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Message tail */}
          <div className={cn(
            "absolute top-4 w-3 h-3 transform rotate-45",
            isUser 
              ? "right-0 translate-x-1 bg-gradient-to-br from-rose-500 to-pink-600" 
              : "left-0 -translate-x-1 bg-white dark:bg-gray-800 border-l border-t border-gray-100 dark:border-gray-700/50"
          )}></div>
        </Card>

        {/* Timestamp */}
        {message.created_at && (
          <div className={cn(
            "text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isUser ? "text-right mr-4" : "text-left ml-4"
          )}>
            {message.created_at.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </div>
  );
}