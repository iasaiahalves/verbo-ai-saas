'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processUserMessage } from '@/lib/chat';
import { Bot, Send } from 'lucide-react';
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
    }  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/30 dark:to-gray-900 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/20 dark:to-rose-800/20 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Ask anything about this document</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              Chat with Verbo about the content, request explanations, or ask for specific information from this PDF.
            </p>
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
      
      <form onSubmit={handleSendMessage} className="border-t border-gray-100 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 flex gap-3 shadow-sm">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this PDF..."
          disabled={isLoading}
          className="flex-1 py-6 px-4 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 rounded-xl focus-visible:ring-rose-500/50 focus-visible:border-rose-500/50 shadow-sm transition-all duration-200"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isLoading || !input.trim()} 
          className="rounded-full w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
        >
          <Send className="h-5 w-5 text-white" />
        </Button>
      </form>
    </div>
  );
}
