'use client';

import { useNavigation } from '@/components/common/navigation-progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavigationLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  exactMatch?: boolean;
}

export default function NavigationLink({
  href,
  children,
  className = '',
  activeClassName = 'text-primary font-medium',
  exactMatch = false,
}: NavigationLinkProps) {
  const pathname = usePathname();
  const { startNavigation } = useNavigation();
  
  const isActive = exactMatch 
    ? pathname === href 
    : pathname.startsWith(href) && (href !== '/' || pathname === '/');
  
  const handleClick = () => {
    // Only trigger navigation indicator for external paths
    if (pathname !== href) {
      startNavigation();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'text-sm transition-colors hover:text-primary',
        isActive && activeClassName,
        className
      )}
    >
      {children}
    </Link>
  );
}
