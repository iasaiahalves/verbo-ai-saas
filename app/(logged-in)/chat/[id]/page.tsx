'use client';

import { fetchChatData, fetchSummaryData } from '@/actions/chat-actions';
import { ChatInterface } from '@/components/chat/chat-interface';
import BgGradient from '@/components/common/bg-gradient';
import { SummaryViewer } from '@/components/summaries/summary-viewer';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ArrowLeftRight, ExternalLink, FileText, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const showSummaryParam = searchParams.get('showSummary') === 'true';
  const chatId = params.id as string;
  // Define a more specific type for chat data
  interface ChatData {
    id: string;
    title: string;
    summary_title?: string;
    file_name?: string;
    updated_at: string;
    pdf_summary_id?: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      created_at: string;
    }>;
  }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatData | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(showSummaryParam);
  const [fetchedSummaries, setFetchedSummaries] = useState<Record<string, any>>({});  // Create a more efficient useEffect for initial data loading that doesn't re-run on summary toggle
  const [isSummaryLoading, setIsSummaryLoading] = useState(false); // State for summary loading indicator
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        
        // Fetch chat data using server action
        const chatData = await fetchChatData(chatId);
        if (!chatData) {
          setError('Chat not found');
          return;
        }
        
        // Type assertion to match our interface
        const typedChatData = chatData as ChatData;
        setChat(typedChatData);
        
        // Check if we should show summary initially based on URL param
        const shouldShowSummary = showSummaryParam;
        setShowSummary(shouldShowSummary);
        
        // If we have a pdf_summary_id and should show summary, fetch it
        if (typedChatData.pdf_summary_id && shouldShowSummary) {
          const summaryId = typedChatData.pdf_summary_id;
          
          // Only fetch if we don't already have it
          if (!fetchedSummaries[summaryId]) {
            const summaryData = await fetchSummaryData(summaryId);
            setFetchedSummaries(prev => ({
              ...prev,
              [summaryId]: summaryData
            }));
            setSummaryData(summaryData);
          } else {
            // Use cached summary data
            setSummaryData(fetchedSummaries[summaryId]);
          }
        }
      } catch (err) {
        setError('Failed to load chat data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInitialData();
    // Only re-run this effect when the chat ID changes, not on summary toggle
  }, [chatId]);
  
  // Add a separate effect to handle URL parameter changes without full reloads
  useEffect(() => {
    // Only update the UI state based on URL, without fetching
    if (chat && chat.pdf_summary_id) {
      const shouldShowSummary = showSummaryParam;
      setShowSummary(shouldShowSummary);
      
      if (shouldShowSummary) {
        // If we should show summary and have it cached, use it
        if (fetchedSummaries[chat.pdf_summary_id]) {
          setSummaryData(fetchedSummaries[chat.pdf_summary_id]);
        }
      } else {
        // If hiding summary, keep the data cached but don't display
        setSummaryData(null);
      }
    }
  }, [showSummaryParam]);
    return (
    <div className="relative isolate min-h-screen bg-linear-to-b from-rose-50/40 to-white">
      <BgGradient className="from-rose-400 via-rose-300 to-orange-200"/> 
      
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500 mb-4"></div>
            <p>Loading chat...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Link href="/dashboard">
              <Button 
                className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
              >
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="container mx-auto flex flex-col h-[calc(100vh-200px)]">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-xl">{chat?.title}</h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{chat?.summary_title || chat?.file_name || 'PDF'}</span>
                  <span className="text-xs ml-2">
                    {chat?.updated_at && formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
              <div className="flex items-center gap-2">
              {chat?.pdf_summary_id && (
                <Link href={`/summaries/${chat.pdf_summary_id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    View Full Summary
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}                {chat?.pdf_summary_id && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1"
                  disabled={isSummaryLoading}
                  onClick={async () => {
                    if (!chat) return;
                    
                    if (showSummary) {
                      // Hide summary - just update local state
                      setShowSummary(false);
                      // Update URL without the parameter
                      router.push(`/chat/${chat.id}`, { scroll: false });
                    } else {
                      // Check if we've already fetched this summary before
                      const summaryId = chat.pdf_summary_id!;
                      
                      if (fetchedSummaries[summaryId]) {
                        // If we already have the data, just show it
                        setSummaryData(fetchedSummaries[summaryId]);
                        setShowSummary(true);
                        // Update URL with the parameter
                        router.push(`/chat/${chat.id}?showSummary=true`, { scroll: false });
                      } else {
                        // If not fetched yet, show loading indicator only for this operation
                        setIsSummaryLoading(true);
                        
                        try {
                          // Fetch summary data
                          const summaryData = await fetchSummaryData(summaryId);
                          
                          // Cache it
                          setFetchedSummaries(prev => ({
                            ...prev,
                            [summaryId]: summaryData
                          }));
                          
                          // Show it
                          setSummaryData(summaryData);
                          setShowSummary(true);
                          
                          // Update URL
                          router.push(`/chat/${chat.id}?showSummary=true`, { scroll: false });
                        } catch (err) {
                          console.error('Failed to fetch summary:', err);
                        } finally {
                          setIsSummaryLoading(false);
                        }
                      }
                    }
                  }}
                >
                  {isSummaryLoading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-rose-500 mr-1"></div>
                      Loading Summary...
                    </>
                  ) : showSummary ? (
                    <>
                      <MinusCircle className="h-3 w-3 mr-1" />
                      Hide Summary
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      Show Summary
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Chat Interface */}
            <div className={`flex-1 ${showSummary && summaryData ? 'lg:w-1/2' : 'w-full'} overflow-hidden`}>
              {chat && (
                <ChatInterface 
                  chatId={chat.id}
                  initialMessages={chat.messages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                    created_at: new Date(msg.created_at)
                  }))}
                />
              )}
            </div>            
            
            {/* Mobile Toggle Button for Summary */}
            {showSummary && summaryData && (
              <div className="lg:hidden text-center py-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mx-auto flex items-center gap-1"
                  onClick={() => {
                    const summaryElement = document.getElementById('mobile-summary');
                    if (summaryElement) {
                      summaryElement.classList.toggle('hidden');
                    }
                  }}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Toggle Summary
                </Button>
              </div>
            )}
            
            {/* Mobile Summary Viewer (full screen when active) */}
            {showSummary && summaryData && (
              <div id="mobile-summary" className="lg:hidden hidden fixed inset-0 z-50 bg-white/95 backdrop-blur-sm p-4 overflow-auto">
                <div className="sticky top-0 z-10 bg-white pb-4 flex justify-between items-center border-b border-gray-200 mb-4">
                  <h3 className="text-lg font-semibold">PDF Summary</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const summaryElement = document.getElementById('mobile-summary');
                      if (summaryElement) {
                        summaryElement.classList.add('hidden');
                      }
                    }}
                  >
                    Close
                  </Button>
                </div>
                <SummaryViewer 
                  summary={summaryData.summary_text} 
                  pdfSummaryId={chat?.pdf_summary_id}
                  className="mx-auto mt-2 h-auto" 
                />
              </div>
            )}
            
            {/* Desktop Summary Viewer */}
            {showSummary && summaryData && (
              <div className="hidden lg:block lg:w-1/2 p-4 overflow-auto">
                <SummaryViewer 
                  summary={summaryData.summary_text} 
                  pdfSummaryId={chat?.pdf_summary_id}
                  className="mx-auto" 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
