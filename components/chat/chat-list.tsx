'use client';

import { useNavigation } from '@/components/common/navigation-progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Chat as ChatType, deleteChat } from '@/lib/chat';
import { formatFileName } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Clock, FileText, MessageSquare, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ChatList({ chats }: { chats: ChatType[] }) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/20 dark:to-rose-800/20 rounded-2xl flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No conversations yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Start a new chat to ask questions about your PDF documents and explore their content.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {chats.map((chat) => (
        <ChatCard key={chat.id} chat={chat} />
      ))}
    </div>
  );
}

function ChatCard({ chat }: { chat: ChatType }) {
  const router = useRouter();
  const { startNavigation } = useNavigation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await deleteChat(chat.id);
      router.refresh();
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  const handleChatClick = () => {
    startNavigation();
  };

  // Get a better title for display
  const displayTitle = chat.title || 
                      (chat as any).summary_title || 
                      formatFileName((chat as any).file_name) || 
                      (chat.pdf_summary_id ? 'Chat about Document' : 'New Chat');

  return (
    <>
      <Card 
        className="group relative overflow-hidden border-0 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="p-6">
          {/* Header with title and actions */}
          <div className="flex items-start justify-between mb-4 min-h-[3rem]">
            <Link 
              href={`/chat/${chat.id}`} 
              className="flex-1 group/link pr-2" 
              onClick={handleChatClick}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="font-medium text-base text-gray-900 dark:text-gray-100 group-hover/link:text-rose-600 dark:group-hover/link:text-rose-400 transition-colors duration-200 line-clamp-2 leading-tight">
                    {displayTitle}
                  </h3>
                </div>
              </div>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className={`flex-shrink-0 w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 mt-1 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Document info */}
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg min-h-[2.5rem]">
            <FileText className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {(chat as any).file_name 
                ? (chat.title !== formatFileName((chat as any).file_name) 
                    ? formatFileName((chat as any).file_name) 
                    : 'Document Chat')
                : 'Document Chat'}
            </span>
          </div>

          {/* Time info */}
          <div className="space-y-2 min-h-[3rem]">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Created {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Last active {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 via-transparent to-purple-500/0 group-hover:from-rose-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Delete Chat
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete "<span className="font-medium">{displayTitle}</span>"? 
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This action cannot be undone and all messages will be permanently removed.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 sm:flex-none"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export interface Message {
  id: string;
  content: string;
  created_at: string | Date;
  // Add other fields as needed
}

export interface Chat {
  id: string;
  title: string;
  summary_title?: string;
  file_name?: string;
  pdf_summary_id?: string;
  messages: Message[];
  created_at: string | Date;
  updated_at: string | Date;
}