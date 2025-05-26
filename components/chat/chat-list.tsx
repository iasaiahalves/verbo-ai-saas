'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Chat as ChatType, deleteChat } from '@/lib/chat';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ChatList({ chats }: { chats: ChatType[] }) {
  if (chats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No chats yet. Start a new chat to ask questions about your PDF.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {chats.map((chat) => (
        <ChatCard key={chat.id} chat={chat} />
      ))}
    </div>
  );
}

function ChatCard({ chat }: { chat: ChatType }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <Link href={`/chat/${chat.id}`} className="flex-1 hover:underline">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-medium">{chat.title}</h3>
            </div>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {(chat as any).summary_title || (chat as any).file_name || 
           (chat.pdf_summary_id ? `Chat about PDF ${chat.pdf_summary_id.substring(0, 8)}...` : 'New Chat')}
        </p>
        
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
        </p>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this chat? This action cannot be undone.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
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
