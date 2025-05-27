'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processUserMessage } from '@/lib/chat';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from './chat-message';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: Date;
};

export function ChatInterface({
  chatId,
  initialMessages = []
}: {
  chatId: string;
  initialMessages?: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Optimistically add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Show loading message
      const loadingMessage: Message = {
        role: 'assistant',
        content: '...',
      };
      
      setMessages(prev => [...prev, loadingMessage]);
      
      // Process the message and get AI response
      const response = await processUserMessage(chatId, userMessage.content);
      
      // Replace loading message with actual response
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        {
          role: 'assistant',
          content: response,
        },
      ]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Replace loading message with error message
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your message. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/20 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f1f5f9%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50 dark:opacity-20"></div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-lg backdrop-blur-sm border border-rose-100/50 dark:border-rose-800/30">
                  <Bot className="h-10 w-10 text-rose-500 dark:text-rose-400" />
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="h-5 w-5 text-pink-500 animate-pulse" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-3">
                Ready to help you explore
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md leading-relaxed">
                Ask me anything about this document. I can explain concepts, find specific information, or help you understand complex topics.
              </p>
              <div className="mt-8 flex flex-wrap gap-2 justify-center">
                {['Summarize key points', 'Find specific data', 'Explain concepts'].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id || index}
              message={message}
              isLoading={isLoading && index === messages.length - 1 && message.role === 'assistant'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input form */}
      <div className="border-t border-white/20 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl relative">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about this document..."
                disabled={isLoading}
                className="min-h-[3rem] px-6 py-4 bg-white/90 dark:bg-gray-800/90 border-2 border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:border-rose-400/50 shadow-lg hover:shadow-xl transition-all duration-200 text-base resize-none backdrop-blur-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                style={{ minHeight: '3rem', maxHeight: '8rem' }}
              />
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()} 
              className="h-12 w-12 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <Send className="h-5 w-5 text-white transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </Button>
          </form>
          
          {/* Status indicator */}
          {isLoading && (
            <div className="flex items-center justify-center mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce delay-200"></div>
                </div>
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}