'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { FileText } from 'lucide-react';
import { ChatNavLink } from './chat-nav-link';
import NavigationLink from './navigation-link';

export default function Header() {
  return (
    <nav className="container flex items-center justify-between py-4 lg:px-8 px-2 mx-auto">      <div className="flex lg:flex-1">
        <NavigationLink href="/" className="flex items-center gap-1 lg:gap-2 shrink-0">
        <FileText className="w-5 h-5 lg:w-8 lg:h-8 text-gray-900 hover:rotate-12 transform transition duration-200 ease-in-out"/>  
          <span className="font-extrabold lg:text-xl text-gray-900">
            Verbo
          </span>
        </NavigationLink>
      </div>      <div className="flex lg:justify-center gap-4 lg:gap-12 lg:items-center">
        <NavigationLink href="/pricing">Pricing</NavigationLink>
        <SignedIn>
          <NavigationLink href="/dashboard">
            Your Summaries
          </NavigationLink>
          <ChatNavLink />
        </SignedIn>
        
      </div><div className="flex lg:justify-end lg:flex-1">
        <SignedIn>
          <div className="flex gap-2 items-center">
            <NavigationLink href="/upload" className="">
              Upload a PDF
            </NavigationLink>
            <div>
              Pro
            </div>
            <SignedIn>
              <UserButton />
            </SignedIn>
           </div>
        </SignedIn>
       
       
        <SignedOut>
          <NavigationLink href="/sign-in">Sign In</NavigationLink>
        </SignedOut>
      
      </div>
    </nav>
  );
}