'use client';

import Footer from "@/components/common/footer";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <>
      {children}
      {isHomePage && <Footer />}
    </>
  );
}
