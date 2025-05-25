'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processUserMessage } from '@/lib/chat';
import { Send } from 'lucide-react';
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isLoading={isLoading && index === messages.length - 1 && message.role === 'assistant'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this PDF..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
