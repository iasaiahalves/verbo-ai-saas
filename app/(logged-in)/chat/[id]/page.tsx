'use client';

import { fetchChatData, fetchSummaryData } from '@/actions/chat-actions';
import { ChatInterface } from '@/components/chat/chat-interface';
import BgGradient from '@/components/common/bg-gradient';
import { SummaryViewer } from '@/components/summaries/summary-viewer';
import { Button } from '@/components/ui/button';
import { formatFileName } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Clock, ExternalLink, Eye, EyeOff, FileText, Palette, Sparkles } from 'lucide-react';
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
  const [fetchedSummaries, setFetchedSummaries] = useState<Record<string, any>>({});
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [chatBgColor, setChatBgColor] = useState('bg-gray-50/80'); // Default dirty white

  // Chat background color options
  const bgColorOptions = [
    { name: 'Dirty White', value: 'bg-gray-50/80' },
    { name: 'Pure White', value: 'bg-white' },
    { name: 'Warm White', value: 'bg-orange-50/50' },
    { name: 'Cool White', value: 'bg-blue-50/50' },
    { name: 'Light Gray', value: 'bg-gray-100/60' },
  ];

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
    <div className="relative isolate h-screen overflow-hidden bg-gradient-to-br from-rose-50/40 via-white to-orange-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/20">
      <BgGradient className="from-rose-400 via-rose-300 to-orange-200 opacity-30 dark:opacity-20"/> 
      
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="inline-block w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-rose-500 animate-pulse" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your conversation...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Oops! Something went wrong</h3>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="h-screen flex flex-col">
          {/* Fixed Header - Always visible */}
          <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/20 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl z-10">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors duration-200">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    {chat?.summary_title || 
                     (chat?.file_name ? formatFileName(chat.file_name) : chat?.title)}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{chat?.title || chat?.summary_title || chat?.file_name || 'PDF Document'}</span>
                    {chat?.updated_at && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs">
                          {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Chat Background Color Selector */}
              <div className="relative group">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Theme</span>
                </Button>
                
                {/* Dropdown for color options */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 px-2">Chat Background</p>
                    {bgColorOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setChatBgColor(option.value)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                          chatBgColor === option.value 
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 border-gray-300 ${option.value}`}></div>
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {chat?.pdf_summary_id && (
                <Link href={`/summaries/${chat.pdf_summary_id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-xl border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200">
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">View Full Summary</span>
                  </Button>
                </Link>
              )}
              
              {chat?.pdf_summary_id && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200"
                  disabled={isSummaryLoading}
                  onClick={async () => {
                    if (!chat) return;
                    
                    if (showSummary) {
                      // Hide summary - just update local state
                      setShowSummary(false);
                      setSummaryData(null);
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
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-rose-300 border-t-rose-500 mr-1"></div>
                      Loading...
                    </>
                  ) : showSummary ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span className="hidden sm:inline">Hide Summary</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Show Summary</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Main content - Takes remaining height */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Interface - Scrollable content area */}
            <div className={`transition-all duration-300 ${showSummary && summaryData ? 'w-1/2 lg:w-3/5' : 'w-full'} h-full flex flex-col ${chatBgColor} dark:bg-gray-900/40`}>
              {chat && (
                <div className="h-full flex flex-col">
                  {/* Chat messages area - scrollable */}
                  <div className="flex-1 overflow-y-auto">
                    <ChatInterface 
                      chatId={chat.id}
                      initialMessages={chat.messages.map((msg: any) => ({
                        id: msg.id,
                        role: msg.role as 'user' | 'assistant',
                        content: msg.content,
                        created_at: new Date(msg.created_at)
                      }))}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Summary Viewer - Fixed height with internal scrolling */}
            {showSummary && summaryData && (
              <div className="w-1/2 lg:w-2/5 h-full border-l border-white/20 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm transition-all duration-300 flex flex-col">
                {/* Summary header - Fixed */}
                <div className="flex-shrink-0 p-4 border-b border-white/20 dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Document Summary</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">AI-generated overview</p>
                    </div>
                  </div>
                </div>
                
                {/* Summary content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                  <SummaryViewer 
                    summary={summaryData.summary_text} 
                    pdfSummaryId={chat?.pdf_summary_id}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}