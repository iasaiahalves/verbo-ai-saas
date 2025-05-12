import Footer from "@/components/common/footer";
import Header from "@/components/common/header";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Source_Sans_3 as FontSans } from "next/font/google";
import "./globals.css";

const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],

});


export const metadata: Metadata = {
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
        <div className="relative flex min-h-screen flex-col">
           <Header />
        <main className="flex-1">{children}</main>
           <Footer />
        </div>
       </body>
    </html>
    </ClerkProvider>
  
  );
}


//57:31 YT 



