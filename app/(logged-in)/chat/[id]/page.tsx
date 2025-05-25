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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch chat data using server action
        const chatData = await fetchChatData(chatId);
        if (!chatData) {
          setError('Chat not found');
          return;
        }
        
        setChat(chatData);
        
        // If we have a pdf_summary_id and showSummary is true, fetch the summary
        if (chatData.pdf_summary_id && showSummaryParam) {
          const summaryData = await fetchSummaryData(chatData.pdf_summary_id);
          setSummaryData(summaryData);
        }
      } catch (err) {
        setError('Failed to load chat data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [chatId, showSummaryParam]);
  
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
                <h1 className="font-semibold text-xl">{chat.title}</h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{chat.summary_title || chat.file_name || 'PDF'}</span>
                  <span className="text-xs ml-2">
                    {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {chat.pdf_summary_id && (
                <Link href={`/summaries/${chat.pdf_summary_id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    View Full Summary
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
              
              {summaryData && (
                <Link href={`/chat/${chat.id}`}>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MinusCircle className="h-3 w-3 mr-1" />
                    Hide Summary
                  </Button>
                </Link>
              )}
              
              {!summaryData && chat.pdf_summary_id && (
                <Link href={`/chat/${chat.id}?showSummary=true`}>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <ArrowLeftRight className="h-3 w-3 mr-1" />
                    Show Summary
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Chat Interface */}
            <div className={`flex-1 ${summaryData ? 'lg:w-1/2' : 'w-full'} overflow-hidden`}>
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
            {/* Mobile Toggle Button for Summary */}
            {summaryData && (
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
            {summaryData && (
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
                  pdfSummaryId={chat.pdf_summary_id}
                  className="mx-auto mt-2 h-auto" 
                />
              </div>
            )}
            
            {/* Desktop Summary Viewer */}
            {summaryData && (
              <div className="hidden lg:block lg:w-1/2 p-4 overflow-auto">
                <SummaryViewer 
                  summary={summaryData.summary_text} 
                  pdfSummaryId={chat.pdf_summary_id}
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
