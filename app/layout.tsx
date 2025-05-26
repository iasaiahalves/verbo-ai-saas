'use client';

import Header from "@/components/common/header";
import { NavigationProgress, NavigationProvider } from "@/components/common/navigation-progress";
import ClientLayout from "@/components/layout/client-layout";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Source_Sans_3 as FontSans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],

});


const metadata: Metadata = {
  title: "Verbo - AI-Powered PDF Summarization ",
  description: "Verbo is an app for summarizing PDF documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
        <html lang="en">
      <body
        className={`${fontSans.variable} font-sans antialiased`}> 
        <NavigationProvider>
          <NavigationProgress />
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <ClientLayout>
                {children}
              </ClientLayout>
            </main>
          </div>
          <Toaster/>
        </NavigationProvider>
       </body>
    </html>
    </ClerkProvider>
  
  );
}


//57:31 YT 



