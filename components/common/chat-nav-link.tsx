'use client';

import { useNavigation } from '@/components/common/navigation-progress';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ChatNavLink() {
  const pathname = usePathname();
  const { startNavigation } = useNavigation();
  const isActive = pathname === '/chats' || pathname.startsWith('/chat/');
  
  const handleClick = () => {
    if (!isActive) {
      startNavigation();
    }
  };
  
  return (
    <Link href="/chats" onClick={handleClick}>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        PDF Chats
      </Button>
    </Link>
  );
}
