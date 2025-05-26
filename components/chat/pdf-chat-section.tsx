'use client';

import { useNavigation } from '@/components/common/navigation-progress';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Add this import
import { createChat } from '@/lib/chat'; // Add this import
import { ArrowRight, Clock, MessageSquare, Sparkles } from 'lucide-react';
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
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const navigatingRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  
  // Clean up effect to reset the ref when component unmounts
  useEffect(() => {
    return () => {
      navigatingRef.current = false;
    };
  }, []);

  // Handle chat creation with custom title
  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatTitle.trim() || isNavigating || navigatingRef.current) return;
    
    setIsNavigating(true);
    navigatingRef.current = true;
    startNavigation();
    
    try {
      // Create chat with custom title
      const chat = await createChat(pdfSummaryId, chatTitle);
      router.replace(`/chat/${chat.id}?showSummary=true`);
    } catch (error) {
      console.error('Failed to create chat:', error);
      setIsNavigating(false);
      navigatingRef.current = false;
    }
  };

  // Modified to show input form when no existing chats
  const handleAskQuestions = useCallback(() => {
    // Debounce check - prevent rapid clicks
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      return;
    }
    lastClickTimeRef.current = now;
    
    // Prevent duplicate navigation
    if (isNavigating || navigatingRef.current) return;
    
    // If there are existing chats, navigate to the most recent one
    if (initialChats && initialChats.length > 0) {
      setIsNavigating(true);
      navigatingRef.current = true;
      startNavigation();
      
      setTimeout(() => {
        const mostRecentChat = initialChats[0]; 
        router.replace(`/chat/${mostRecentChat.id}?showSummary=true`);
      }, 50);
    } else {
      // If no existing chats, show title input instead of navigating
      setShowTitleInput(true);
    }
  }, [initialChats, isNavigating, router, startNavigation]);

  const hasExistingChats = initialChats && initialChats.length > 0;

  return (
    <div className="mt-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-0 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Chat with Verbo
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered document assistant
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {!showTitleInput ? (
              <>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {hasExistingChats 
                    ? "Continue your conversation about this document. Ask follow-up questions and dive deeper into specific topics."
                    : "Ready to explore this document? Ask questions, request explanations, or discuss key concepts with Verbo's AI assistance."
                  }
                </p>

                {/* Previous chat indicator */}
                {hasExistingChats && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                    <Clock className="h-3 w-3" />
                    <span>Last conversation: {formatDate(initialChats[0].updated_at)}</span>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2">
                  <Button 
                    onClick={handleAskQuestions}
                    disabled={isNavigating}
                    size="lg"
                    className={`group relative w-full sm:w-auto transition-all duration-200 ${
                      hasExistingChats 
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl" 
                        : "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg hover:shadow-xl"
                    } text-white border-0`}
                  >
                    {isNavigating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                        <span className="font-medium">
                          {hasExistingChats ? "Continue Conversation" : "Start Asking Questions"}
                        </span>
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleCreateChat} className="pt-2 space-y-4">
                <div className="space-y-2">
                  <Input
                    id="chat-title"
                    value={chatTitle}
                    onChange={(e) => setChatTitle(e.target.value)}
                    placeholder="Enter a title for your chat"
                    className="w-full"
                    autoFocus
                    disabled={isNavigating}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    A descriptive title helps you find this conversation later
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit"
                    disabled={!chatTitle.trim() || isNavigating}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg hover:shadow-xl text-white border-0"
                  >
                    {isNavigating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        <span>Creating Chat...</span>
                      </>
                    ) : (
                      "Create Chat"
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowTitleInput(false)}
                    disabled={isNavigating}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Feature highlights */}
            {!showTitleInput && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                {[
                  { icon: "🔍", text: "Deep Analysis" },
                  { icon: "💡", text: "Smart Insights" },
                  { icon: "📝", text: "Detailed Explanations" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-sm">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}