import { ChatList } from '@/components/chat/chat-list';
import BgGradient from '@/components/common/bg-gradient';
import { Button } from '@/components/ui/button';
import { getUserChats } from '@/lib/chat';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ChatsPage() {
  const chats = await getUserChats();

  return (
    <div className="relative isolate min-h-screen bg-linear-to-b from-rose-50/40 to-white">
      <BgGradient className="from-rose-400 via-rose-300 to-orange-200"/> 
      <div className="container mx-auto py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Your PDF Chats</h1>
          </div>
        </div>

        <div className="mt-8">
          <ChatList chats={chats as any} />
        </div>
      </div>
    </div>
  );
}
